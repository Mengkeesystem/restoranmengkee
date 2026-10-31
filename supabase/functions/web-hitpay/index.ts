// =====================================================================
// 明记官网 · HitPay 网上付款 —— Supabase Edge Function「web-hitpay」
// ---------------------------------------------------------------------
// 放在明记 ERP 的 Supabase 项目（跟 web-delyva 同一个项目）。⚠️ 绝不能放牛室的项目。
// 部署时要把「Verify JWT / Enforce JWT verification」关掉（客人没登录；HitPay 的通知也不带登录凭证）。
//
// 流程：
//   1. 客人网页先 create_web_order（待付款），再 POST {action:"pay", ref, token, oi, cart, notes, voucher, qaddr}
//      → 这里用网站的 config.js【自己重算金额】（菜单价、打包盒、优惠码、SST、Delyva 运费），
//        跟订单金额对不上就拒绝；对得上就【重写订单讯息的菜品/金额那一段】（客人改不了厨房看到的内容），
//        再向 HitPay 建付款单，回传付款页网址，客人跳过去付款。
//   2. HitPay 付款成功 → 通知（webhook）打到这里 → 验签名 → 再向 HitPay 查一次这张付款单真的 completed、金额对 →
//      订单改成「已收款」（confirmed_by = HitPay）→ 外送单自动请 web-delyva 叫骑手。
//   3. 客人回到网站后，网页也会 POST {action:"check", ref, token}，这里向 HitPay 查状态（webhook 没到也不会卡住）。
//   绝不相信网页传来的「已付款」或金额：只认 HitPay API 查到的结果。
//
// Secrets（Edge Functions → Secrets，只有这里读得到，绝不放网页/仓库/聊天）：
//   WEB_HITPAY_API_KEY              HitPay 后台 Settings → API Keys 的 API Key（共用账号：没有自己账号的分店都用它收款）
//   WEB_HITPAY_WEBHOOK_SALT         HitPay 后台 Developers → Webhook Endpoints 里，这个 webhook 的 Salt
//   WEB_HITPAY_API_KEY_<分店序号>    某间分店用自己的 HitPay 账号时才填（例如 OKR = 0 → WEB_HITPAY_API_KEY_0）
//   WEB_HITPAY_WEBHOOK_SALT_<分店序号> 同上，那个账号的 webhook salt
//   WEB_HITPAY_BASE                 默认 https://api.hit-pay.com（正式）；测试填 https://api.sandbox.hit-pay.com
//   WEB_HITPAY_CURRENCY             默认 MYR（HitPay 测试账号只能选新加坡 → 测试时填 SGD）
//   WEB_SITE_URL                    默认 https://restoranmengkee.com.my（读 config.js、付款后回到网站）
//   WEB_HITPAY_FEE_TOLERANCE        外送运费重新报价时，比客人看到的高多少以内还接受（RM），默认 1
//
// webhook 网址（登记在 HitPay 后台 Developers → Webhook Endpoints，事件选 payment_request.completed）：
//   共用账号：https://<项目>.supabase.co/functions/v1/web-hitpay?a=d
//   分店自己的账号：…/web-hitpay?a=<分店序号>（例如 ?a=0）
// =====================================================================

const VERSION = "2026-10-31c";
const env = (k: string, d = "") => (Deno.env.get(k) ?? d).trim();
const SB_URL = env("SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");
const HP_BASE = env("WEB_HITPAY_BASE", "https://api.hit-pay.com").replace(/\/$/, "");
const HP_CUR = env("WEB_HITPAY_CURRENCY", "MYR").toUpperCase();
const SITE_URL = env("WEB_SITE_URL", "https://restoranmengkee.com.my").replace(/\/$/, "");
const FEE_TOL = Math.max(0, Number(env("WEB_HITPAY_FEE_TOLERANCE", "1")) || 0);
const ORIGINS = ["https://mengkeesystem.github.io", "https://restoranmengkee.com.my", "https://www.restoranmengkee.com.my"];

const cors = (req: Request) => {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) || /^http:\/\/localhost(:\d+)?$/.test(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
class UserError extends Error {}   // 可以给客人看的错误（不含内部资料）

// ---------- HitPay 账号（每间分店可以有自己的账号；没有就用共用账号） ----------
function account(oi: number | null) {
  const own = oi !== null && env(`WEB_HITPAY_API_KEY_${oi}`);
  if (own) return { id: String(oi), key: own, salt: env(`WEB_HITPAY_WEBHOOK_SALT_${oi}`) };
  const key = env("WEB_HITPAY_API_KEY");
  return key ? { id: "d", key, salt: env("WEB_HITPAY_WEBHOOK_SALT") } : null;
}
const accountById = (a: string) => a === "d" ? account(null) : /^\d{1,2}$/.test(a) && env(`WEB_HITPAY_API_KEY_${a}`) ? account(Number(a)) : null;

const formBody = (f: Record<string, string | string[]>) => { const u = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) (Array.isArray(v) ? v : [v]).forEach((x) => u.append(k, x)); return u.toString(); };
async function hp(acct: { key: string }, method: string, path: string, form?: Record<string, string | string[]>) {
  let r: Response;
  try {
    r = await fetch(HP_BASE + path, {
      method,
      headers: { "X-BUSINESS-API-KEY": acct.key, "X-Requested-With": "XMLHttpRequest", Accept: "application/json",
        ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
      body: form ? formBody(form) : undefined,
    });
  } catch { throw new Error("HitPay 连不上"); }
  let j: any = null;
  try { j = await r.json(); } catch { /* 非 JSON */ }
  if (!r.ok) throw new Error(`HitPay ${r.status}: ${String(j?.message || j?.error || JSON.stringify(j?.errors || "") || "error").slice(0, 200)}`);   // 不带 key
  return j;
}

// ---------- 数据库（service role，只在服务器上） ----------
async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`db ${r.status}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}
const orderByRef = async (ref: string) => (await db(`web_orders?ref=eq.${encodeURIComponent(ref)}&select=*`))[0] || null;
const patch = (id: number, p: Record<string, unknown>, extra = "") => db(`web_orders?id=eq.${id}${extra}`, { method: "PATCH", body: JSON.stringify(p) });

// ---------- 网站设定 config.js（菜单价钱等，跟客人网页用的同一份） ----------
let siteCache: { at: number; S: any } | null = null;
async function site() {
  if (siteCache && Date.now() - siteCache.at < 2 * 60000) return siteCache.S;
  const r = await fetch(`${SITE_URL}/config.js?t=${Math.floor(Date.now() / 60000)}`);
  if (!r.ok) throw new Error(`读不到网站设定 config.js（${r.status}）`);
  const w: any = {};
  new Function("window", await r.text())(w);   // 自己网站的 config.js（只有 window.SITE = {...}）
  if (!w.SITE || !Array.isArray(w.SITE.menu)) throw new Error("网站设定 config.js 格式不对");
  siteCache = { at: Date.now(), S: w.SITE };
  return w.SITE;
}

// ---------- 价钱计算（照 index.html 的同一套规则；改网页的算法要一起改这里） ----------
const r2 = (n: number) => Math.round(n * 100) / 100;
const money = (S: any, n: number) => `${(S.ordering && S.ordering.currency) || "RM"} ${r2(n).toFixed(2)}`;
const klDate = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
const noteHash = (s: string) => { let h = 5381; for (const c of s) h = ((h * 33) ^ (c.codePointAt(0) as number)) >>> 0; return "n" + h.toString(36); };
async function sha256(t: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
function priceBook(S: any) {
  const items: Record<string, any> = Object.create(null), cat: Record<string, any> = Object.create(null);
  (S.menu || []).forEach((c: any) => (c.items || []).forEach((it: any) => { items[it.id] = it; cat[it.id] = c; }));
  const O = S.ordering || {}, D = O.delivery || {}, PK = O.packaging || null, CU = O.customize || {};
  const unit = (it: any, si: number) => it.prices ? it.prices[si] : it.price;
  const delPrice = (p: number) => { const a = +D.priceAdd || 0, m = +D.priceMarkup || 0, st = +D.markupStep || 0.5;
    if (a > 0) return r2(p + a); return m > 0 ? r2(Math.ceil(p * (1 + m) / st - 1e-9) * st) : p; };
  const hasMarkup = +D.priceAdd > 0 || +D.priceMarkup > 0;
  const boxOf = (it: any) => { if (!PK) return 0; const c = cat[it.id]; return +(it.box != null ? it.box : (c && c.box != null ? c.box : PK.fee)) || 0; };
  const opts = (it: any) => { const c = cat[it.id]; return c && c.customize === false ? [] : (CU.options || []); };
  const sizes = (it: any) => { const n = (it.prices || []).length; return it.sizes || (n === 2 ? ["小", "大"] : n === 3 ? ["小", "中", "大"] : n === 4 ? ["小", "中", "大", "特大"] : []); };
  return { items, unit, delPrice, hasMarkup, boxOf, opts, sizes, PK, D, O };
}
const keyOf = (id: string, si: number, oi: number, mods: number[], nh: string) => {
  const m = mods.slice().sort((a, b) => a - b).join(".");
  return id + "|" + (si || 0) + "|" + (oi || 0) + (m || nh ? "|" + m + "|" + (nh || "") : "");
};
const cleanNote = (s: unknown, max: number) => String(s || "").replace(/[\[\]=|<>•·\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/* 用购物车重算整张单：回传金额明细 + 订单讯息的「标题/分店/菜品/金额」那一段（中文，跟网页 buildMsg 同格式） */
async function priceOrder(S: any, a: { cart: unknown; notes: unknown; voucher: unknown; del: boolean; oi: number; fee: number | null; feeTag: string }) {
  const B = priceBook(S), outlet = (S.outlets || [])[a.oi];
  if (!outlet) throw new UserError("分店不对");
  if (!a.cart || typeof a.cart !== "object" || Array.isArray(a.cart)) throw new UserError("购物车是空的");
  const notes: Record<string, unknown> = a.notes && typeof a.notes === "object" && !Array.isArray(a.notes) ? a.notes as Record<string, unknown> : {};
  const entries = Object.entries(a.cart as Record<string, unknown>);
  if (!entries.length || entries.length > 60) throw new UserError("购物车是空的");
  const lines: string[] = []; let sub = 0, box = 0, count = 0;
  for (const [k, qv] of entries) {
    const [id, siS, oiS, mS, nh = ""] = k.split("|"), it = B.items[id], si = Number(siS) || 0, oo = Number(oiS) || 0, q = Number(qv);
    const mods = mS ? mS.split(".").map(Number) : [], os = it ? B.opts(it) : [];
    const note = nh ? cleanNote(notes[k], Math.min(60, +(S.ordering?.customize?.noteMax) || 30)) : "";
    const ok = it && !it.soldOut && !it.seasonal && k === keyOf(id, si, oo, mods, nh) && /^[\w-]+$/.test(id)
      && Number.isInteger(q) && q >= 1 && q <= 99 && (it.prices ? si < it.prices.length : si === 0) && (it.options ? oo < it.options.length : oo === 0)
      && mods.every((x) => Number.isInteger(x) && x >= 0 && x < os.length) && new Set(mods).size === mods.length
      && (!nh || (note.length > 0 && noteHash(note) === nh));
    if (!ok) throw new UserError("购物车里有菜品资料不对（可能菜单刚更新），请重新整理网页再下单");
    const p = a.del ? B.delPrice(B.unit(it, si)) : B.unit(it, si);
    sub += p * q; box += B.boxOf(it) * q; count += q;
    const lab = [it.prices ? B.sizes(it)[si] : null, it.options ? it.options[oo] : null].filter(Boolean);
    const parts = mods.map((i) => os[i] ? os[i].zh : "").filter(Boolean);
    const cust = parts.length || note ? ` [${parts.join(", ")}${note ? (parts.length ? "; " : "") + "其他要求: " + note : ""}]` : "";
    lines.push(`• ${it.code ? it.code + " " : ""}${it.name}${lab.length ? " (" + lab.join(", ") + ")" : ""}${cust} x${q} = ${money(S, p * q)}`);
  }
  sub = r2(sub); box = r2(box);
  // 优惠码：只存哈希，跟网页一样比对；日期按吉隆坡时间
  let disc = 0, vLine: string | null = null;
  const code = String(a.voucher || "").trim().toUpperCase().slice(0, 40);
  if (code) {
    const h = await sha256("mk-voucher:" + code), v = (Array.isArray(S.vouchers) ? S.vouchers : []).find((x: any) => x.hash === h), d = klDate();
    if (!v || (v.from && v.from > d) || (v.to && v.to < d)) throw new UserError("优惠码无效或已过期，请移除后再下单");
    if (sub >= (v.minSpend || 0)) {
      let off = v.type === "percent" ? sub * (v.value || 0) / 100 : v.type === "amount" ? (v.value || 0) : 0;
      if (v.maxOff) off = Math.min(off, v.maxOff);
      disc = r2(Math.min(off, sub));
    }
    const desc = v.title || (v.type === "percent" ? `${v.value}% off` : v.type === "amount" ? `-${money(S, v.value)}` : "");
    vLine = `优惠码: ${code} (${desc})${disc > 0 ? " −" + money(S, disc) : ""}${v.type === "gift" && v.gift ? " · " + v.gift : ""}${sub < (v.minSpend || 0) ? " ⚠️ 未达最低消费" : ""}`;
  }
  const rate = outlet.sst === false ? 0 : (+(S.ordering?.sstRate) || 0);
  const sst = r2((sub - disc + box) * rate);
  let fee = 0;
  if (a.del) {
    if (B.D.minOrder && sub - disc < B.D.minOrder) throw new UserError(`外送最低消费 ${money(S, B.D.minOrder)}`);
    fee = B.D.freeAbove && sub - disc >= B.D.freeAbove ? 0 : r2(a.fee ?? 0);
  }
  const total = r2(sub - disc + box + sst + fee);
  const head = [a.del ? "【网上点餐 - 外送】" : "【网上点餐 - 自取】", `分店: ${outlet.name}`, ...lines,
    `小计: ${money(S, sub)}${a.del && B.hasMarkup ? " (外送价)" : ""}`, ...(vLine ? [vLine] : []),
    ...(box > 0 && B.PK ? [`${B.PK.label}: ${money(S, box)}`] : []), ...(rate ? [`SST ${Math.round(rate * 1000) / 10}%: ${money(S, sst)}`] : []),
    ...(a.del ? [`运费: ${fee === 0 ? "免运费" : money(S, fee)}${a.feeTag ? ` (${a.feeTag})` : ""}`] : []), `合计: ${money(S, total)}`];
  return { sub, disc, box, sst, fee, total, count, head: head.join("\n"), outlet };
}

/* 客人那段（姓名/电话/地址/备注…）照用网页的，但去掉看起来像菜品/金额的行（免得每月总结被灌假数字） */
const FAKE = /^\s*(•|SST|运费|Delivery fee|优惠码|Voucher|小计|Subtotal|合计|Total|打包盒|Takeaway box|付款方式|Payment)(\s|:|：|$)/i;   // \b 对中文字不管用
const tailOf = (msg: string) => { const i = msg.indexOf("\n\n"); return i < 0 ? "" : msg.slice(i + 2).split("\n").filter((l) => !FAKE.test(l)).join("\n").slice(0, 2500); };

/* 外送运费：再问一次 Delyva（同一个 web-delyva 报价，有快取，跟客人看到的通常一样） */
async function delyvaFee(o: any, qaddr: string) {
  const d = o.dest || {};
  const r = await fetch(`${SB_URL}/functions/v1/web-delyva`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SRK, Authorization: `Bearer ${SRK}` },   // 内部呼叫：web-delyva 不算客人的报价次数
    body: JSON.stringify({ action: "quote", idx: o.outlet_idx, lat: d.lat, lng: d.lng, address: qaddr || d.address, unit: d.unit || "", items: d.items || 1 }) });
  const j = await r.json().catch(() => null);
  return j && j.ok === true && typeof j.fee === "number" ? { fee: r2(j.fee), tag: `Delyva${j.service ? " · " + String(j.service).slice(0, 60) : ""}` } : null;
}

// ---------- 接单时段（2026-10-30 业主：截单后网页和服务器都要挡，不用店员手动取消） ----------
// 按网站 config.js 的 delivery.windows（平日/周末各几段 [开始, 最后点餐]，含头含尾、按分钟，吉隆坡时间）。
// 外送单一律按这个时段；自取单在 ordering.pickupFollowsDelivery=true 时也一样。用订单建立时间（服务器时间）判断。
const hm = (s: string) => { const [h, m] = String(s).split(":").map(Number); return h * 60 + m; };
function orderWindowOk(S: any, del: boolean, at: number) {
  const d = S.ordering?.delivery, w = d?.windows;
  if (!w || !(del || S.ordering?.pickupFollowsDelivery)) return true;
  const kl = new Date(at + 8 * 3600000), day = kl.getUTCDay(), m = kl.getUTCHours() * 60 + kl.getUTCMinutes();
  const segs = (day === 0 || day === 6) ? w.weekend : w.weekday;
  if (!Array.isArray(segs)) return true;
  return segs.some((x: any) => Array.isArray(x) && m >= hm(x[0]) && m <= hm(x[1]));
}

// ---------- 客人按「前往付款」 ----------
const REF_RE = /^MK\d{4}-\d{4}$/, UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HPID_RE = /^[A-Za-z0-9-]{8,64}$/;   // HitPay 付款单号（文件写 UUID，实际格式可能不同，放宽）
/* HitPay 付款页：只认 https + hit-pay.com 的网域（securecheckout.hit-pay.com、securecheckout.sandbox.hit-pay.com…） */
const hpUrlOk = (u: string) => { try { const x = new URL(u); return x.protocol === "https:" && (x.hostname === "hit-pay.com" || x.hostname.endsWith(".hit-pay.com")); } catch { return false; } };
const hits = new Map<string, number[]>();
function limited(k: string, n: number, winMs: number) {
  const now = Date.now(), h = (hits.get(k) || []).filter((t) => now - t < winMs);
  if (h.length >= n) return true;
  h.push(now); hits.set(k, h); if (hits.size > 5000) hits.clear();
  return false;
}
async function loadOwn(b: any) {
  const ref = String(b.ref || ""), token = String(b.token || "");
  if (!REF_RE.test(ref) || !UUID_RE.test(token)) throw new UserError("订单资料不对");
  const o = await orderByRef(ref);
  if (!o || String(o.token).toLowerCase() !== token.toLowerCase()) throw new UserError("找不到这张订单");
  return o;
}
async function pay(req: Request, b: any) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (limited("pay:" + ip, 20, 10 * 60000)) throw new UserError("操作太频繁，请稍后再试");
  const [o, S] = await Promise.all([loadOwn(b), site()]);   // 同时读订单和网站设定，省一点时间
  if (o.status !== "pending") throw new UserError(o.status === "paid" ? "这张订单已经付款了" : "这张订单已取消");
  if (Date.now() - Date.parse(o.created_at) > 30 * 60000) throw new UserError("订单已过期，请重新下单");
  if (o.pay_id && o.pay_url) {   // 已经建过付款单（客人按了两次 / 回来继续付）
    if (!b.repay) return { ok: true, url: o.pay_url, amount: Number(o.amount) };
    return await repay(o, S, b);   // 回来「继续付款」时想换付款方式（2026-10-31）
  }

  const oi = Number(b.oi), del = o.order_type === "delivery";
  if (!orderWindowOk(S, del, Date.parse(o.created_at) || Date.now())) {   // 截单后：订单直接作废，不建付款单
    await patch(o.id, { status: "rejected", confirmed_at: new Date().toISOString(), confirmed_by: "系统：已过网上点餐时间" }, "&status=eq.pending");
    throw new UserError("网上点餐（自取和外送）已截单，请在接单时间内再下单");
  }
  const outlet = (S.outlets || [])[oi];
  if (!Number.isInteger(oi) || !outlet || String(outlet.name).slice(0, 80) !== o.outlet || (del && o.outlet_idx !== oi)) throw new UserError("分店资料不对");
  const all = S.payment && S.payment.gateway === "hitpay";   // 全部分店用 HitPay（hitpay:false 排除）；否则只有 hitpay:true 的分店
  if (all ? outlet.hitpay === false : outlet.hitpay !== true) throw new UserError("这间分店还没开网上付款");
  const acct = account(oi);
  if (!acct) throw new Error("还没设定 HitPay API key（WEB_HITPAY_API_KEY）");

  // 先不算运费，得出食物+打包盒+SST；外送单的运费 = 订单金额 − 这些，再跟重新报价比
  const base = await priceOrder(S, { cart: b.cart, notes: b.notes, voucher: b.voucher, del, oi, fee: 0, feeTag: "" });
  let fee = 0, feeTag = "";
  if (del) {
    const claimed = r2(Number(o.amount) - (base.sub - base.disc + base.box + base.sst));
    const fa = +(S.ordering?.delivery?.freeAbove) || 0;
    if (fa && base.sub - base.disc >= fa) fee = 0;   // 满额免运费
    else {
      const q = await delyvaFee(o, String(b.qaddr || "").slice(0, 300));
      if (!q) throw new UserError("暂时拿不到外送运费，请稍后再试，或改成到店自取");
      if (claimed < 0 || q.fee - claimed > FEE_TOL + 1e-9) throw new UserError(`外送运费有变动（现在是 ${money(S, q.fee)}），请重新下单`);
      fee = claimed; feeTag = "";   // 客人看得到这行（我的订单/收据），不写骑手公司名（2026-10-31 业主）
      if (Math.abs(q.fee - claimed) > 0.005) console.log(`pay ${o.ref} fee: customer ${claimed} / now ${q.fee} (${q.tag})`);
    }
  }
  const P = await priceOrder(S, { cart: b.cart, notes: b.notes, voucher: b.voucher, del, oi, fee, feeTag });
  if (Math.abs(P.total - Number(o.amount)) > 0.01) {
    await patch(o.id, { status: "rejected", confirmed_at: new Date().toISOString(), confirmed_by: `系统：金额不符（应付 ${P.total.toFixed(2)}）` }, "&status=eq.pending");
    console.log(`pay ${o.ref} amount mismatch: order ${o.amount} vs server ${P.total}`);
    throw new UserError("订单金额对不上（可能菜单或价钱刚更新），请重新整理网页再下单");
  }
  if (del && o.dest && Number(o.dest.items) !== P.count) throw new UserError("订单份数对不上，请重新下单");

  const message = `${P.head}\n\n${tailOf(String(o.message))}\n付款方式: HitPay 网上付款 · 参考号 ${o.ref}`.slice(0, 5900);
  const form: Record<string, string | string[]> = {
    amount: P.total.toFixed(2), currency: HP_CUR, reference_number: o.ref,
    purpose: `Restoran Meng Kee ${o.ref}`.slice(0, 100), name: String(o.customer_name || "").slice(0, 60),
    redirect_url: `${SITE_URL}/?hp=${encodeURIComponent(o.ref)}`, allow_repeated_payments: "false", send_email: "false",
  };
  // 客人在网站选的付款方式（2026-10-31：先推 DuitNow 等手续费低的）：只认 config.js payment.methods 里的组别，代码只准字母/底线
  const grp = (Array.isArray(S.payment?.methods) ? S.payment.methods : []).find((m: any) => m && m.key === String(b.pm || ""));
  const codes = grp && Array.isArray(grp.codes) ? grp.codes.map(String).filter((c: string) => /^[a-z_]{2,40}$/.test(c)).slice(0, 10) : [];
  let reqHp: any;
  if (codes.length) {
    try { reqHp = await hp(acct, "POST", "/v1/payment-requests", { ...form, "payment_methods[]": codes }); }
    catch (e) { console.log(`pay ${o.ref} methods ${codes.join(",")} refused, retry all: ${String((e as Error).message).slice(0, 120)}`); }   // 账号没开这个方式：改成全部方式
  }
  if (!reqHp) reqHp = await hp(acct, "POST", "/v1/payment-requests", form);
  const url = String(reqHp?.url || ""), id = String(reqHp?.id || "");
  if (!HPID_RE.test(id) || !hpUrlOk(url)) {
    let host = ""; try { host = new URL(url).hostname; } catch { /* */ }
    throw new Error(`HitPay 没有回传付款页（id=${id.slice(0, 40)} host=${host || "-"} keys=${Object.keys(reqHp || {}).join(",").slice(0, 120)}）`);
  }
  await patch(o.id, { message, pay_provider: "hitpay", pay_acct: acct.id, pay_id: id, pay_url: url, pay_status: "pending" }, "&status=eq.pending");
  console.log(`pay ${o.ref} → HitPay ${id} ${P.total.toFixed(2)} ${HP_CUR}`);
  return { ok: true, url, amount: P.total };
}

// ---------- 待付款订单：换付款方式 / 取消 / 逾期清理（2026-10-31 业主：客人按了下单付款但没付，要能继续付或取消） ----------
const PENDING_MS = 30 * 60000;
/* 把 HitPay 上这张付款单作废（客人不能再用旧网址付款）。成功回 true；HitPay 不让删（例如正在付款中）回 false */
async function dropRequest(o: any): Promise<boolean> {
  try {
    const acct = accountById(String(o.pay_acct || "")); if (!acct || !o.pay_id) return true;
    await hp(acct, "DELETE", `/v1/payment-requests/${encodeURIComponent(o.pay_id)}`);
    return true;
  } catch (e) { console.log(`drop ${o.ref} ${o.pay_id} failed: ${String((e as Error).message).slice(0, 160)}`); return false; }
}
async function repay(o: any, S: any, b: any) {
  const r = await confirmFromHitPay(o, "repay");   // 先看看是不是其实已经付了
  if (r.status === "paid") return { ok: true, paid: true };
  if (r.pay === "mismatch") throw new UserError("付款资料需要人工核对，请联系店家");
  const grp = (Array.isArray(S.payment?.methods) ? S.payment.methods : []).find((m: any) => m && m.key === String(b.pm || ""));
  const codes = grp && Array.isArray(grp.codes) ? grp.codes.map(String).filter((c: string) => /^[a-z_]{2,40}$/.test(c)).slice(0, 10) : [];
  if (!codes.length) return { ok: true, url: o.pay_url, amount: Number(o.amount) };
  const acct = accountById(String(o.pay_acct || "")); if (!acct) throw new Error("找不到这张单的 HitPay 账号设定");
  if (!(await dropRequest(o))) return { ok: true, url: o.pay_url, amount: Number(o.amount) };   // 旧付款单作废不了：照旧用旧的，免得重复付款
  const form: Record<string, string | string[]> = {
    amount: Number(o.amount).toFixed(2), currency: HP_CUR, reference_number: o.ref,
    purpose: `Restoran Meng Kee ${o.ref}`.slice(0, 100), name: String(o.customer_name || "").slice(0, 60),
    redirect_url: `${SITE_URL}/?hp=${encodeURIComponent(o.ref)}`, allow_repeated_payments: "false", send_email: "false",
  };
  let reqHp: any;
  try { reqHp = await hp(acct, "POST", "/v1/payment-requests", { ...form, "payment_methods[]": codes }); }
  catch (e) { console.log(`repay ${o.ref} methods refused, retry all: ${String((e as Error).message).slice(0, 120)}`); }
  if (!reqHp) reqHp = await hp(acct, "POST", "/v1/payment-requests", form);
  const url = String(reqHp?.url || ""), id = String(reqHp?.id || "");
  if (!HPID_RE.test(id) || !hpUrlOk(url)) throw new Error("HitPay 没有回传付款页（repay）");
  await patch(o.id, { pay_id: id, pay_url: url, pay_status: "pending" }, "&status=eq.pending");
  console.log(`repay ${o.ref} → HitPay ${id} (${codes.join(",")})`);
  return { ok: true, url, amount: Number(o.amount) };
}
/* 客人自己取消（还没付款）。已经付款了 → 不能取消，要走退款政策 */
async function cancelOwn(req: Request, b: any) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (limited("cancel:" + ip, 20, 10 * 60000)) throw new UserError("操作太频繁，请稍后再试");
  const o = await loadOwn(b);
  if (o.status === "paid") return { ok: false, paid: true };
  if (o.status !== "pending") return { ok: true, already: true };
  if (o.pay_provider === "hitpay" && o.pay_id) {
    const r = await confirmFromHitPay(o, "cancel");   // 取消前再确认一次有没有付款
    if (r.status === "paid") return { ok: false, paid: true };
    if (r.pay === "mismatch") throw new UserError("付款资料需要人工核对，请联系店家");
    await dropRequest(o);
  }
  await patch(o.id, { status: "rejected", confirmed_at: new Date().toISOString(), confirmed_by: "客人取消（未付款）", pay_status: "cancelled" }, "&status=eq.pending");
  console.log(`cancel ${o.ref} by customer`);
  return { ok: true };
}
/* 超过 30 分钟还没付的单：作废付款单 + 订单设成已拒绝（后台就不会一直挂着「等客人付款」）。每次最多处理 5 张 */
let lastSweep = 0;
async function sweepStale() {
  if (Date.now() - lastSweep < 5 * 60000) return; lastSweep = Date.now();
  try {
    const from = new Date(Date.now() - 3 * 86400000).toISOString(), to = new Date(Date.now() - (PENDING_MS + 5 * 60000)).toISOString();
    const rows = await db(`web_orders?status=eq.pending&created_at=gte.${from}&created_at=lt.${to}&select=*&order=created_at.asc&limit=5`);
    for (const o of rows || []) {
      if (o.pay_provider === "hitpay" && o.pay_id) {
        const r = await confirmFromHitPay(o, "sweep"); if (r.status === "paid" || r.pay === "mismatch") continue;
        await dropRequest(o);
      }
      await patch(o.id, { status: "rejected", confirmed_at: new Date().toISOString(), confirmed_by: "系统：逾期未付款", pay_status: "expired" }, "&status=eq.pending");
      console.log(`sweep ${o.ref} expired`);
    }
  } catch (e) { console.log(`sweep error ${String((e as Error).message).slice(0, 160)}`); }
}

// ---------- 确认付款（只认 HitPay API 查到的结果） ----------
async function confirmFromHitPay(o: any, via: string) {
  if (!o || o.pay_provider !== "hitpay" || !o.pay_id) return { status: o?.status || "notfound" };
  const acct = accountById(String(o.pay_acct || ""));
  if (!acct) throw new Error("找不到这张单的 HitPay 账号设定");
  const pr = await hp(acct, "GET", `/v1/payment-requests/${encodeURIComponent(o.pay_id)}`);
  const st = String(pr?.status || "").toLowerCase();
  if (st !== "completed") {
    if (st && st !== o.pay_status) await patch(o.id, { pay_status: st.slice(0, 20) });
    return { status: o.status, pay: st };
  }
  const amt = Number(pr.amount), cur = String(pr.currency || "").toUpperCase();
  const pays = Array.isArray(pr.payments) ? pr.payments.filter((p: any) => String(p.status) === "succeeded") : [];
  const method = String(pays[0]?.payment_type || "").slice(0, 40), fees = r2(pays.reduce((s: number, p: any) => s + (Number(p.fees) || 0), 0));
  if (String(pr.reference_number || "") !== o.ref || Math.abs(amt - Number(o.amount)) > 0.01 || cur !== HP_CUR) {
    await patch(o.id, { pay_status: "mismatch", courier_error: `⚠️ HitPay 付款资料对不上（${amt} ${cur}），请人工核对` });
    console.log(`confirm ${o.ref} mismatch ${amt} ${cur}`);
    return { status: o.status, pay: "mismatch" };
  }
  const now = new Date().toISOString(), info = { pay_status: "completed", paid_at: now, paid_amount: amt, pay_method: method || null, pay_fees: fees || null };
  const rows = await patch(o.id, { ...info, status: "paid", confirmed_at: now, confirmed_by: "HitPay" }, "&status=eq.pending");
  if (!rows?.length) {   // 没改到：webhook 和网页同时到、另一边已经设成已收款；或店员先拒绝了。重新读一次现在的状态再决定（不能用手上的旧资料）
    const cur = await orderByRef(o.ref);
    const st = String(cur?.status || o.status);
    if (st === "rejected") await patch(o.id, { ...info, pay_status: "paid_rejected" });
    return { status: st, pay: "completed" };
  }
  console.log(`paid ${o.ref} via ${via} ${amt} ${cur} ${method}`);
  if (o.order_type === "delivery") await autoDispatch(o.id);
  return { status: "paid", pay: "completed" };
}
/* 外送单付款后自动叫骑手（请 web-delyva 做，用 service role 当内部呼叫）；失败的话 web-delyva 会把原因写在订单上，店员可按「叫骑手」重试 */
async function autoDispatch(id: number) {
  try {
    const r = await fetch(`${SB_URL}/functions/v1/web-delyva`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SRK, Authorization: `Bearer ${SRK}` },
      body: JSON.stringify({ action: "dispatch", id }) });
    if (!r.ok) console.log(`auto dispatch ${id} failed ${r.status}: ${(await r.text()).slice(0, 200)}`);
  } catch (e) { console.log(`auto dispatch ${id} error ${(e as Error).message}`); }
}

// ---------- HitPay webhook ----------
async function hmacHex(secret: string, raw: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(raw)))).map((x) => x.toString(16).padStart(2, "0")).join("");
}
const sameStr = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
async function webhook(req: Request, raw: string) {
  const a = new URL(req.url).searchParams.get("a") || "d", acct = accountById(a);
  if (!acct || !acct.salt) return json(req, { error: "webhook salt not set" }, 401);
  const sig = (req.headers.get("hitpay-signature") || "").trim().toLowerCase();
  if (!sig || !sameStr(await hmacHex(acct.salt, raw), sig)) return json(req, { error: "bad signature" }, 401);
  let d: any; try { d = JSON.parse(raw); } catch { return json(req, { error: "bad json" }, 400); }
  const ids = [d?.id, d?.payment_request_id, d?.payment_request?.id].map((x) => String(x || "")).filter((x) => HPID_RE.test(x));
  const refs = [d?.reference_number, d?.payment_request?.reference_number].map((x) => String(x || "")).filter((x) => REF_RE.test(x));
  let o: any = null;
  for (const id of ids) { o = (await db(`web_orders?pay_id=eq.${id}&select=*`))[0]; if (o) break; }
  if (!o) for (const r of refs) { o = await orderByRef(r); if (o) break; }
  if (!o || o.pay_acct !== acct.id) return json(req, { ok: true, unknown: true });   // 不是网站的单（例如店里的收款机），或账号对不上
  const res = await confirmFromHitPay(o, "webhook");
  return json(req, { ok: true, status: res.status });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method" }, 405);
  const raw = await req.text();
  try {
    if (req.headers.has("hitpay-signature")) return await webhook(req, raw);
    let b: any = {}; try { b = JSON.parse(raw || "{}"); } catch { /* */ }
    if (b.action === "pay") return json(req, await pay(req, b));
    if (b.action === "cancel") return json(req, await cancelOwn(req, b));
    if (b.action === "warm") {   // 客人打开购物车/付款视窗时先「暖机」：先载好网站设定，外送单顺便叫醒 web-delyva，按「前往付款」时就快一点
      const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
      if (limited("warm:" + ip, 20, 10 * 60000)) return json(req, { ok: true });
      try { (globalThis as any).EdgeRuntime?.waitUntil(sweepStale()); } catch { /* */ }   // 顺便清一下逾期没付款的单
      await Promise.all([site().catch(() => null),
        b.del ? fetch(`${SB_URL}/functions/v1/web-delyva`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SRK, Authorization: `Bearer ${SRK}` }, body: '{"action":"status"}' }).then((r) => r.text()).catch(() => null) : null]);
      return json(req, { ok: true });
    }
    if (b.action === "check") {
      const o = await loadOwn(b);
      if (o.status !== "pending" || limited("check:" + o.ref, 1, 4000)) return json(req, { status: o.status });
      const res = await confirmFromHitPay(o, "check");
      if (res.status === "pending" && Date.now() - Date.parse(o.created_at) > PENDING_MS + 5 * 60000 && res.pay !== "mismatch") {   // 逾期没付：作废
        await dropRequest(o);
        await patch(o.id, { status: "rejected", confirmed_at: new Date().toISOString(), confirmed_by: "系统：逾期未付款", pay_status: "expired" }, "&status=eq.pending");
        return json(req, { status: "rejected", pay: "expired" });
      }
      return json(req, res);
    }
    if (b.action === "status") return json(req, { ok: true, version: VERSION, base: HP_BASE, currency: HP_CUR, configured: !!account(null) });
    return json(req, { error: "unknown action" }, 400);
  } catch (e) {
    const user = e instanceof UserError, msg = String((e as Error)?.message || e).slice(0, 300);
    if (!user) console.log(`error: ${msg}`);
    return json(req, { error: user ? msg : "付款系统暂时出错，请稍后再试" }, 400);   // 内部错误细节只写在函数 Logs，不回传给客人
  }
});
