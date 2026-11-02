// =====================================================================
// 明记官网 · 员工后台手机通知 —— Supabase Edge Function「web-push」（2026-11-02）
// ---------------------------------------------------------------------
// 放在明记 ERP 的 Supabase 项目（跟 web-hitpay / web-delyva 同一个项目）。⚠️ 绝不能放牛室的项目。
// 部署时要把「Verify JWT」关掉（web-hitpay / web-delyva 用 service role 内部呼叫；员工用自己的登录凭证，函数自己检查）。
//
// 作用：付款成功 / 出问题的时候，向员工的手机发 Web Push（关掉网页、锁屏也收得到）。
//   • 员工在后台按「📲 开启手机通知」→ 浏览器订阅 → POST {action:"subscribe", sub}（要登录 + 在 web_staff 名单里）
//   • web-hitpay / web-delyva 内部呼叫 {action:"notify", kind:"paid"|"alert", id, text}（Authorization = service role）
//     → 只发给「看得到这张订单」的员工：管理员全部；分店经理只收自己分店的
//   • 推送内容只有参考号、分店、自取/外送、金额（不含客人姓名/电话/地址）
//
// Secrets（Edge Functions → Secrets；私钥只放这里，绝不放网页/仓库）：
//   WEB_VAPID_PUBLIC    推送公钥（公开的，员工浏览器订阅时用）
//   WEB_VAPID_PRIVATE   推送私钥（⚠️ 保密）
//   WEB_VAPID_SUBJECT   可不填，默认 https://restoranmengkee.com.my
// 数据表：supabase/push.sql（web_push_subs）
// 监控：GET <函数网址>?health=1 → {"ok":true,...}（给 UptimeRobot 之类的服务看）
// =====================================================================
const VERSION = "2026-11-02a";
const env = (k: string, d = "") => (Deno.env.get(k) ?? d).trim();
const SB_URL = env("SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");
const ANON = env("SUPABASE_ANON_KEY");
const VAPID_PUBLIC = env("WEB_VAPID_PUBLIC");
const VAPID_PRIVATE = env("WEB_VAPID_PRIVATE");
const VAPID_SUBJECT = env("WEB_VAPID_SUBJECT", "https://restoranmengkee.com.my");
const ORIGINS = ["https://mengkeesystem.github.io", "https://restoranmengkee.com.my", "https://www.restoranmengkee.com.my"];
const MAX_SUBS_PER_STAFF = 8;

const cors = (req: Request) => {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) || /^http:\/\/localhost(:\d+)?$/.test(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
};
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
class UserError extends Error {}

const sameKey = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const isInternal = (req: Request) => !!SRK && sameKey(req.headers.get("authorization") || "", `Bearer ${SRK}`);

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`db ${r.status}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

/* 登录的员工（要在 web_staff 名单里）。回传 {email, role, outlets} */
async function staffOf(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!/^Bearer\s+ey/.test(auth)) throw new UserError("请先登录员工后台");
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: ANON || SRK, Authorization: auth } });
  if (!r.ok) throw new UserError("登录已过期，请重新登录员工后台");
  const email = String((await r.json())?.email || "").toLowerCase();
  if (!email) throw new UserError("请先登录员工后台");
  const rows = await staffRows();
  const s = rows.find((x) => String(x.email).toLowerCase() === email);
  if (!s) throw new UserError("这个账号不在店员白名单里");
  return s;
}
/* web_staff：还没跑 staff.sql（没有 role / outlets 栏）就全部当管理员，跟 web-delyva / web-hitpay 一样 */
async function staffRows(): Promise<{ email: string; role: string; outlets: number[] }[]> {
  let rows: any[];
  try { rows = await db(`web_staff?select=email,role,outlets`); } catch { rows = (await db(`web_staff?select=email`)).map((x: any) => ({ ...x, role: "admin", outlets: [] })); }
  return rows.map((x) => ({ email: String(x.email || "").toLowerCase(), role: x.role === "manager" ? "manager" : "admin", outlets: Array.isArray(x.outlets) ? x.outlets.map(Number) : [] }));
}

// ---------- 订阅 ----------
/* 只收主流浏览器的推送服务网址（服务器之后会向这个网址发请求，不能让人填内部网址） */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
const B64U = /^[A-Za-z0-9_-]+={0,2}$/;
function cleanSub(s: any) {
  const endpoint = String(s?.endpoint || ""), p256dh = String(s?.keys?.p256dh || ""), auth = String(s?.keys?.auth || "");
  let u: URL; try { u = new URL(endpoint); } catch { throw new UserError("订阅资料不对"); }
  if (u.protocol !== "https:" || u.port || endpoint.length > 600 || !PUSH_HOSTS.some((re) => re.test(u.hostname))) throw new UserError("这个浏览器的推送服务不支持");
  if (!B64U.test(p256dh) || p256dh.length < 60 || p256dh.length > 120 || !B64U.test(auth) || auth.length < 16 || auth.length > 40) throw new UserError("订阅资料不对");
  return { endpoint, p256dh, auth };
}
async function subscribe(req: Request, b: any) {
  const st = await staffOf(req), sub = cleanSub(b.sub), ua = String(b.ua || req.headers.get("user-agent") || "").slice(0, 160);
  await db(`web_push_subs?on_conflict=endpoint`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ endpoint: sub.endpoint, email: st.email, p256dh: sub.p256dh, auth: sub.auth, ua, updated_at: new Date().toISOString() }) });
  const mine = await db(`web_push_subs?email=eq.${encodeURIComponent(st.email)}&select=endpoint,updated_at&order=updated_at.desc`);   // 同一个人最多留最近的几台
  for (const x of (mine || []).slice(MAX_SUBS_PER_STAFF)) await db(`web_push_subs?endpoint=eq.${encodeURIComponent(x.endpoint)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return { ok: true };
}
async function unsubscribe(req: Request, b: any) {
  const st = await staffOf(req), endpoint = String(b.endpoint || "");
  if (endpoint) await db(`web_push_subs?endpoint=eq.${encodeURIComponent(endpoint)}&email=eq.${encodeURIComponent(st.email)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return { ok: true };
}

// ---------- 发送 ----------
async function sender() {
  const wp = (globalThis as any).__webpush ?? (await import("npm:web-push@3.6.7")).default;   // 用到才载入（不拖慢其他动作）；测试时可以换成假的
  wp.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return wp;
}
async function sendTo(subs: { endpoint: string; p256dh: string; auth: string }[], payload: object) {
  if (!subs.length) return { sent: 0, total: 0 };
  const wp = await sender(), body = JSON.stringify(payload);
  let sent = 0;
  await Promise.allSettled(subs.map(async (s) => {
    try {
      await wp.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 3600, urgency: "high", timeout: 8000 });
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await db(`web_push_subs?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => null);   // 这台手机已经取消订阅了
      else console.log(`push failed ${e?.statusCode || ""} ${String(e?.message || e).slice(0, 120)}`);
    }
  }));
  return { sent, total: subs.length };
}
const money = (n: unknown) => "RM " + (Number(n) || 0).toFixed(2);
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);

/* 内部呼叫：付款成功 / 出问题 → 发给看得到这张订单的员工 */
async function notify(b: any) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return { ok: false, error: "没设定 WEB_VAPID_PUBLIC / WEB_VAPID_PRIVATE" };
  const id = Number(b.id), kind = b.kind === "alert" ? "alert" : "paid";
  if (!Number.isInteger(id) || id <= 0) throw new UserError("bad id");
  const o = (await db(`web_orders?id=eq.${id}&select=ref,outlet,outlet_idx,order_type,amount`))[0];
  if (!o) return { ok: true, sent: 0, unknown: true };
  const oi = Number.isInteger(o.outlet_idx) ? o.outlet_idx : null;
  const who = (await staffRows()).filter((s) => s.role === "admin" || (oi !== null && s.outlets.includes(oi))).map((s) => s.email);
  if (!who.length) return { ok: true, sent: 0 };
  const subs = await db(`web_push_subs?email=in.(${who.map((e) => `"${e.replace(/"/g, "")}"`).join(",")})&select=endpoint,p256dh,auth`);
  const type = o.order_type === "delivery" ? "外送" : "自取";
  const payload = kind === "alert"
    ? { title: `⚠️ 订单需要处理 ${o.ref}`, body: `${clean(b.text, 120) || "请打开后台查看"}（${clean(o.outlet, 40)} · ${type} · ${money(o.amount)}）`, tag: `a-${o.ref}`, url: "admin.html" }
    : { title: `🔔 新订单 ${o.ref}`, body: `${clean(o.outlet, 40)} · ${type} · ${money(o.amount)} · 已付款，请开始准备`, tag: `p-${o.ref}`, url: "admin.html" };
  const r = await sendTo(subs || [], payload);
  console.log(`notify ${kind} ${o.ref} → ${r.sent}/${r.total}`);
  return { ok: true, ...r };
}
/* 员工自己按「发送测试通知」：只发给自己的手机 */
async function test(req: Request) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) throw new UserError("后台还没设定推送密钥（WEB_VAPID_PUBLIC / WEB_VAPID_PRIVATE）");
  const st = await staffOf(req);
  const subs = await db(`web_push_subs?email=eq.${encodeURIComponent(st.email)}&select=endpoint,p256dh,auth`);
  if (!subs?.length) throw new UserError("这个账号还没有开启手机通知");
  const r = await sendTo(subs, { title: "✅ 测试通知", body: "收到这个，就代表新订单来的时候手机会响。", tag: "test", url: "admin.html" });
  return { ok: true, ...r };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  const health = new URL(req.url).searchParams.get("health");
  if (req.method === "GET") {   // 监控用：数据库连得上 + 推送密钥有设定 → ok:true，否则 503
    if (!health) return json(req, { error: "method" }, 405);
    const problems: string[] = [];
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) problems.push("没设定推送密钥");
    try { await db(`web_push_subs?select=endpoint&limit=1`); } catch { problems.push("数据库连不上或还没跑 push.sql"); }
    return json(req, { ok: problems.length === 0, version: VERSION, problems }, problems.length ? 503 : 200);
  }
  if (req.method !== "POST") return json(req, { error: "method" }, 405);
  let b: any = {}; try { b = JSON.parse((await req.text()) || "{}"); } catch { /* */ }
  try {
    if (b.action === "status") return json(req, { ok: true, version: VERSION, configured: !!(VAPID_PUBLIC && VAPID_PRIVATE), publicKey: VAPID_PUBLIC });   // 公钥本来就是公开的
    if (b.action === "notify") { if (!isInternal(req)) return json(req, { error: "forbidden" }, 403); return json(req, await notify(b)); }
    if (b.action === "subscribe") return json(req, await subscribe(req, b));
    if (b.action === "unsubscribe") return json(req, await unsubscribe(req, b));
    if (b.action === "test") return json(req, await test(req));
    return json(req, { error: "unknown action" }, 400);
  } catch (e) {
    const user = e instanceof UserError, msg = String((e as Error)?.message || e).slice(0, 300);
    if (!user) console.log(`error: ${msg}`);
    return json(req, { error: user ? msg : "通知系统暂时出错" }, user ? 400 : 500);
  }
});
