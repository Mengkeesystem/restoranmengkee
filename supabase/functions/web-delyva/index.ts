// =====================================================================
// 明记官网 · 外送自动叫骑手（Delyva）—— Supabase Edge Function「web-delyva」
// ---------------------------------------------------------------------
// 放在明记 ERP 的 Supabase 项目（跟 ERP 的 send-order-push 分开）。⚠️ 绝不能放牛室的项目。
// 部署时要把「Verify JWT / Enforce JWT verification」关掉（Delyva 的 webhook 不会带登录凭证）；
// 店员操作由这里自己检查登录 + web_staff 白名单。
//
// Secrets（Edge Functions → Secrets，只有这里读得到，绝不放网页/仓库/聊天）：
//   WEB_DELYVA_API_KEY       Delyva 后台 Settings → API Integration 的 API key（必填）
//   WEB_DELYVA_CUSTOMER_ID   Delyva 的 Customer ID（必填，数字）
//   WEB_DELYVA_API_SECRET    Delyva 的 API secret（建议填：用来验证 webhook 签名）
//   WEB_DELYVA_COMPANY_CODE  追踪网址用，例如 my（正式）；测试账号看 Delyva 给的网址
//   WEB_DELYVA_SENDER_PHONE  分店还没填电话时，给骑手联络的电话
//   WEB_DELYVA_ITEM_TYPE     默认 FOOD
//   WEB_DELYVA_SERVICE       想固定用哪个骑手服务（服务代码或名字的一部分，例如 grab）；不填 = 照 WEB_DELYVA_SORT
//   WEB_DELYVA_SORT          fastest（默认）= 用 Delyva 报价排第一的服务（Delyva 账号 Sort Services 设 Fastest 时第一个就是最快的）；cheapest = 最便宜
//   WEB_DELYVA_BASE          默认 https://api.delyva.app/v1.0
//   WEB_DELYVA_PICKUP_MIN    下单后几分钟让骑手来取，默认 15
//
// 店员（admin.html，带登录）：POST {action:"dispatch"|"cancel"|"setup_webhook"|"status", id?}
// 客人（官网购物车，不用登录）：POST {action:"quote", idx, lat, lng, address, unit, items} → Delyva 运费报价
//   （只回传运费和服务名；有输入检查、限次、10 分钟快取；选服务的规则跟叫骑手一样，所以报价 = 之后叫车的价钱）
// Delyva webhook：POST（header X-Delyvax-Hmac-Sha256 / X-Delyvax-Event）
// API 格式照 Delyva 官方 WooCommerce 插件（github.com/delyva/wp-delyvax）。
// =====================================================================

const VERSION = "2026-10-28f";   // 改程序就改这个，员工后台会显示，方便确认部署的是哪一版
const env = (k: string, d = "") => (Deno.env.get(k) ?? d).trim();
const SB_URL = env("SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");
const ANON = env("SUPABASE_ANON_KEY");
const DKEY = env("WEB_DELYVA_API_KEY");
const DCUST = env("WEB_DELYVA_CUSTOMER_ID");
const DSECRET = env("WEB_DELYVA_API_SECRET");
const DBASE = env("WEB_DELYVA_BASE", "https://api.delyva.app/v1.0").replace(/\/$/, "");
const DCODE = env("WEB_DELYVA_COMPANY_CODE", "my");
const ITEM_TYPE = env("WEB_DELYVA_ITEM_TYPE", "FOOD");
const SENDER_PHONE = env("WEB_DELYVA_SENDER_PHONE");
const PREF_SERVICE = env("WEB_DELYVA_SERVICE").toLowerCase();
const SORT = env("WEB_DELYVA_SORT", "fastest").toLowerCase();
const PICKUP_MIN = Math.max(0, Math.min(120, Number(env("WEB_DELYVA_PICKUP_MIN", "15")) || 15));
const FN_URL = `${SB_URL}/functions/v1/web-delyva`;
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
const getOrder = async (id: number) => (await db(`web_orders?id=eq.${id}&select=*`))[0] || null;
async function patchOrder(id: number, patch: Record<string, unknown>) {
  const body = { ...patch, courier_updated_at: new Date().toISOString() };
  try { return await db(`web_orders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body) }); }
  catch (e) {   // 还没跑新版 delivery.sql（没有这些新栏）时，去掉新栏再存一次，不影响叫车/状态
    const msg = String((e as Error).message), b = body as Record<string, unknown>;
    const drop = ["courier_track_url", "completed_at", "completed_by"].filter((k) => k in b && msg.includes(k));
    if (!drop.length) throw e;
    for (const k of ["courier_track_url", "completed_at", "completed_by"]) delete b[k];
    return db(`web_orders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(b) });
  }
}
/* 客人追踪骑手的网址（Delyva 公开追踪页） */
const trackUrl = (no: unknown) => no ? `https://${DCODE}.delyva.app/customer/strack?trackingNo=${encodeURIComponent(String(no))}` : null;

// ---------- 店员登录检查 ----------
async function staffEmail(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!/^Bearer\s+ey/.test(auth)) return null;            // 只认登录后的 JWT，不认 publishable key
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: ANON || SRK, Authorization: auth } });
  if (!r.ok) return null;
  const u = await r.json();
  const email = String(u?.email || "").toLowerCase();
  if (!email) return null;
  const staff: { email: string }[] = await db("web_staff?select=email");
  return staff.some((s) => String(s.email).toLowerCase() === email) ? email : null;
}

// ---------- Delyva ----------
async function dv(method: string, path: string, body?: unknown, extra: Record<string, string> = {}, tries = 1): Promise<any> {
  let r: Response;
  try {
    r = await fetch(DBASE + path, {
      method,
      headers: { "content-type": "application/json", "X-Delyvax-Access-Token": DKEY, ...extra },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {   // 网络问题：再试一次
    if (tries > 1) { await new Promise((ok) => setTimeout(ok, 800)); return dv(method, path, body, extra, tries - 1); }
    throw new Error("Delyva 连不上");
  }
  if (r.status >= 500 && tries > 1) { await new Promise((ok) => setTimeout(ok, 800)); return dv(method, path, body, extra, tries - 1); }
  return dvParse(r);
}
async function dvParse(r: Response) {
  let j: any = null;
  try { j = await r.json(); } catch { /* 非 JSON */ }
  if (!r.ok) throw new Error(`Delyva ${r.status}: ${j?.error?.message || j?.message || "error"}`);   // 不带 key
  return j;
}

const STATE: Record<string, string> = { "Kuala Lumpur": "KUL", "Selangor": "SGR", "Negeri Sembilan": "NSN", "Putrajaya": "PJY" };
function stateFromPostcode(pc: string) {
  const n = Number(pc);
  if (n >= 50000 && n <= 60000) return "KUL";
  if (n >= 62000 && n <= 62988) return "PJY";
  if (n >= 70000 && n <= 73509) return "NSN";
  if ((n >= 40000 && n <= 48300) || (n >= 63000 && n <= 68100)) return "SGR";
  return "";
}
const postcodeOf = (s: string) => (String(s).match(/\b\d{5}\b/) || [""])[0];
const cityOf = (s: string, pc: string) => (pc ? (String(s).split(pc)[1] || "").split(",")[0].trim() : "");
const phoneMY = (p: string) => { let d = String(p || "").replace(/\D/g, ""); if (d.startsWith("0")) d = "6" + d; return d; };
function klTime(min: number) {   // "YYYY-MM-DD HH:mm:ss"，马来西亚时间
  const d = new Date(Date.now() + min * 60000 + 8 * 3600000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// ---------- 报价 + 选服务（客人看运费和店员叫骑手共用，两边价钱才会一样） ----------
const weightOf = (items: number) => Math.min(20, Math.max(1, Math.round(Math.max(1, items) * 0.6 * 10) / 10));
const svcCode = (s: any) => s?.service?.serviceCompany?.companyCode || s?.service?.code || s?.serviceCode || s?.code;
const svcPrice = (s: any) => Number(s?.price?.amount ?? s?.price ?? 1e9);
const svcName = (s: any) => String(s?.service?.name || s?.name || (s ? svcCode(s) : "") || "").slice(0, 80);
async function quoteFor(out: any, d: any, weight: number) {
  const dpc = postcodeOf(d.address), dState = stateFromPostcode(dpc), oState = STATE[out.state] || stateFromPostcode(out.postcode);
  const quote = (itemType: string) => dv("POST", "/service/instantQuote/", {
    customerId: Number(DCUST),
    origin: { address1: out.address, address2: "", city: out.city || "", state: oState, postcode: out.postcode || "", country: "MY", coord: { lat: out.lat, lon: out.lng } },
    destination: { address1: d.address, address2: d.unit || "", city: cityOf(d.address, dpc), state: dState, postcode: dpc, country: "MY", coord: { lat: d.lat, lon: d.lng } },
    weight: { value: weight, unit: "kg" },
    itemType,
  }, {}, 2);   // 报价失败（网络/5xx）再试一次
  const listOf = (q: any): any[] => {
    const c = q?.data?.services ?? q?.services ?? q?.data?.quotes ?? q?.data;
    return Array.isArray(c) ? c.filter((s) => s && (s.service || s.code || s.serviceCode)) : [];
  };
  let itemType = ITEM_TYPE, q: any = await quote(itemType), services = listOf(q);
  const quoteRaw = JSON.stringify(q ?? null).slice(0, 160);
  if (!services.length && itemType !== "PARCEL") { itemType = "PARCEL"; q = await quote(itemType); services = listOf(q); }
  // 选服务：WEB_DELYVA_SERVICE 指定的 → 否则 fastest（默认）= Delyva 排第一的（账号 Sort Services 设 Fastest）；cheapest = 最便宜
  const priced = services.filter((s) => svcPrice(s) < 1e8);
  const pick = priced.length ? ((PREF_SERVICE && priced.find((s) => [svcCode(s), s?.service?.code, s?.service?.name, s?.name].some((v) => String(v || "").toLowerCase().includes(PREF_SERVICE))))
    || (SORT === "cheapest" ? priced.slice().sort((a, b) => svcPrice(a) - svcPrice(b))[0] : priced[0])) : null;
  console.log(`quote ${itemType} ${weight}kg → ${services.map((x) => `${svcName(x)}=${svcPrice(x)}`).join(" | ") || "无服务"} ⇒ ${pick ? svcName(pick) : "-"}`);
  return { pick, itemType, quoteRaw, dpc, dState, oState };
}

// 客人报价：不用登录，所以要挡乱用——输入检查、每个 IP 10 分钟最多 40 次、全部 10 分钟最多 1500 次、同一位置 10 分钟内用快取
const AREA = { n: 3.45, s: 2.45, e: 102.15, w: 101.25 };   // 跟 config.js delivery.area 一样（雪隆 + 芙蓉）
const qHits = new Map<string, number[]>(), qAll: number[] = [], qCache = new Map<string, { at: number; body: unknown }>();
function qLimited(ip: string) {
  const now = Date.now(), win = 10 * 60000;
  while (qAll.length && now - qAll[0] > win) qAll.shift();
  const h = (qHits.get(ip) || []).filter((t) => now - t < win);
  if (h.length >= 40 || qAll.length >= 1500) return true;
  h.push(now); qHits.set(ip, h); qAll.push(now);
  if (qHits.size > 5000) qHits.clear();
  return false;
}
async function publicQuote(req: Request, b: any) {
  if (!DKEY || !DCUST) return { ok: false, error: "not configured" };
  const idx = Number(b.idx), lat = Number(b.lat), lng = Number(b.lng), items = Math.round(Number(b.items));
  const address = String(b.address ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 300), unit = String(b.unit ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 80);
  if (!Number.isInteger(idx) || idx < 0 || idx > 50 || !isFinite(lat) || !isFinite(lng) || lat > AREA.n || lat < AREA.s || lng > AREA.e || lng < AREA.w
    || !Number.isInteger(items) || items < 1 || items > 99 || address.length < 5) return { ok: false, error: "bad input" };
  const weight = weightOf(items), key = `${idx}|${lat.toFixed(4)}|${lng.toFixed(4)}|${weight}|${postcodeOf(address)}`;
  const c = qCache.get(key);
  if (c && Date.now() - c.at < 10 * 60000) return c.body;
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (qLimited(ip)) return { ok: false, error: "too many" };
  const out = (await db(`web_outlets?idx=eq.${idx}&select=*`))[0];
  if (!out || !out.delivery) return { ok: false, error: "outlet" };
  const { pick } = await quoteFor(out, { lat, lng, address, unit }, weight);
  const body = pick && svcPrice(pick) < 1e8
    ? { ok: true, fee: Math.round(svcPrice(pick) * 100) / 100, service: svcName(pick), weight }
    : { ok: false, error: "no service" };
  if (qCache.size > 2000) qCache.clear();
  qCache.set(key, { at: Date.now() - ((body as any).ok ? 0 : 9 * 60000), body });   // 报到价快取 10 分钟；报不到只记 1 分钟（客人按重新报价可以很快再问）
  return body;
}

async function dispatch(id: number, by: string) {
  if (!DKEY || !DCUST) throw new Error("还没设定 WEB_DELYVA_API_KEY / WEB_DELYVA_CUSTOMER_ID");
  const o = await getOrder(id);
  if (!o) throw new Error("找不到订单");
  if (o.order_type !== "delivery") throw new Error("这不是外送单");
  if (o.status !== "paid") throw new Error("要先按「已收款」才能叫骑手");
  if (!o.dest || o.outlet_idx === null) throw new Error("这张单没有送餐地址/出餐分店资料（旧订单），请手动叫车");
  if (o.courier_order_id && o.courier_status !== 900) return { already: true, order: o };   // 已叫过且没取消
  const out = (await db(`web_outlets?idx=eq.${o.outlet_idx}&select=*`))[0];
  if (!out) throw new Error("找不到出餐分店资料（web_outlets）");

  const d = o.dest, items = Math.max(1, Number(d.items) || 1), weight = weightOf(items);
  const senderPhone = phoneMY(out.phone || SENDER_PHONE);
  if (!senderPhone) throw new Error("还没设定分店电话（web_outlets.phone 或 WEB_DELYVA_SENDER_PHONE）");

  // 1) 报价，选服务（跟客人在购物车看到的报价同一套）。FOOD 没有服务就改 PARCEL 再问；都没有就不指定服务，让 Delyva 自己选
  const { pick, itemType, quoteRaw, dpc, dState, oState } = await quoteFor(out, d, weight);
  const code = svcCode;

  // 2) 建单（isDraft:false = 直接下单叫骑手）
  const loc = (addr: string, unit: string, city: string, state: string, pc: string, lat: number, lng: number) =>
    ({ address: addr, address2: unit, city, state, country: "MY", postcode: pc, coordinates: { lat: String(lat), lon: String(lng) } });   // Delyva 要求坐标是文字（2026-10-27 实测 400）
  const res = await dv("POST", "/order/ms2781/create", {
    customerId: Number(DCUST),
    orderNumber: o.ref,
    sender: { contactName: `Restoran Meng Kee ${out.name_en || out.name}`, contactEmail: "", contactNumber: senderPhone,
      location: loc(out.address, "", out.city || "", oState, out.postcode || "", out.lat, out.lng) },
    receiver: { contactName: o.customer_name || "Customer", contactEmail: "", contactNumber: phoneMY(o.customer_phone),
      location: loc(d.address, d.unit || "", cityOf(d.address, dpc), dState, dpc, d.lat, d.lng) },
    parcel: { weight: { unit: "kg", parcelWeight: weight }, quantity: 1, orderRemarks: `${o.ref}${d.unit ? " · " + d.unit : ""}${d.note ? " · " + d.note : ""}`.slice(0, 250) },
    inventory: [{ name: `Meng Kee food order ${o.ref}`, value: { amount: Number(o.amount), currency: "MYR" }, weight: { value: weight, unit: "kg" }, quantity: 1, description: `Cooked food · ${items} item(s)` }],
    deliveryService: { ...(pick ? { serviceType: code(pick) } : {}), pickupDateTime: klTime(PICKUP_MIN), codAmount: 0, insuranceAmount: 0, itemType },
    source: "mengkee-website",
    isDraft: false,
  }, { "idempotency-key": `mk-${o.ref}-${o.courier_status === 900 ? Date.now() : "1"}` });
  const ds = res?.deliveryService || res?.data?.deliveryService || res?.data || {};
  const orderId = ds.orderId || ds.id;
  if (!orderId) throw new Error(`Delyva 没有回传订单号${pick ? "" : "（报价也没有服务：" + quoteRaw + "）"}：${JSON.stringify(res ?? null).slice(0, 160)}`);
  const fee = Number(ds?.deliveryCost?.amount ?? pick?.price?.amount ?? 0) || null;
  const [saved] = await patchOrder(id, {
    courier: "delyva", courier_order_id: String(orderId), courier_tracking: ds.trackingNumber || ds.consignmentNo || null,
    courier_track_url: trackUrl(ds.trackingNumber || ds.consignmentNo),
    courier_service: pick ? svcName(pick) : "Delyva 自动选择", courier_fee: fee, courier_status: 100,
    courier_rider: null, courier_error: null,
  });
  console.log(`dispatch ${o.ref} by ${by} → ${orderId}`);
  return { order: saved };
}

async function cancel(id: number, by: string) {
  const o = await getOrder(id);
  if (!o?.courier_order_id) throw new Error("这张单还没叫骑手");
  await dv("POST", "/order/ms2781/cancel", { orderId: o.courier_order_id });
  const [saved] = await patchOrder(id, { courier_status: 900, courier_error: `已由 ${by} 取消` });
  return { order: saved };
}

async function setupWebhook() {
  const list: any[] = (await dv("GET", "/webhook"))?.data || [];
  const need = ["order_tracking.change", "order.created"].filter((ev) => !list.some((w) => w.url === FN_URL && w.event === ev));
  for (const ev of need) await dv("POST", "/webhook/", { event: ev, url: FN_URL });
  return { url: FN_URL, added: need, existing: list.filter((w) => w.url === FN_URL).map((w) => w.event) };
}

// ---------- webhook ----------
async function hmacOk(raw: string, sig: string) {
  if (!DSECRET || !sig) return false;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(DSECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(raw)));
  const want = btoa(String.fromCharCode(...mac));
  if (want.length !== sig.length) return false;
  let diff = 0; for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
async function webhook(req: Request, raw: string) {
  let data: any; try { data = JSON.parse(raw); } catch { return json(req, { error: "bad json" }, 400); }
  if (DSECRET) {
    if (!(await hmacOk(raw, req.headers.get("x-delyvax-hmac-sha256") || ""))) return json(req, { error: "bad signature" }, 401);
  } else if (DCODE.toLowerCase() !== "trydx") {
    // 正式账号一定要有 API Secret 验签：customerId 不是秘密，只核对它别人可以伪造「已送达」或塞假骑手电话给客人
    return json(req, { error: "webhook secret not set" }, 401);
  } else if (!DCUST || Number(data?.customerId) !== Number(DCUST)) {
    return json(req, { error: "customer mismatch" }, 401);      // 只限测试账号 trydx：没 secret 时核对 customerId
  }
  return json(req, await applyStatus(data));
}
const cut = (v: unknown, n: number) => (v === null || v === undefined || v === "") ? null : String(v).slice(0, n);
/* 把一笔 Delyva 状态写进订单（真的 webhook 和测试模拟共用同一段） */
async function applyStatus(data: any) {
  const delyvaId = String(data?.orderId ?? data?.id ?? "");
  const code = Number(data?.statusCode);
  if (!delyvaId || !Number.isInteger(code) || code < 0 || code > 2000) return { ok: true, ignored: true };
  const rows = await db(`web_orders?courier_order_id=eq.${encodeURIComponent(delyvaId)}&select=*`);
  if (!rows.length) return { ok: true, unknown: true };    // 不是网站叫的单
  const p = data?.personnel;
  await patchOrder(rows[0].id, {
    courier_status: code,
    ...(data?.consignmentNo ? { courier_tracking: String(data.consignmentNo).slice(0, 60), courier_track_url: trackUrl(String(data.consignmentNo).slice(0, 60)) } : {}),
    // 送达 → 订单自动进「已完成」（店员已经手动按完成的就不改）
    ...((code === 700 || code === 1000) && !rows[0].completed_at ? { completed_at: new Date().toISOString(), completed_by: "Delyva" } : {}),
    ...(p ? { courier_rider: { name: cut(p.name, 60), phone: cut(String(p.phone ?? p.contactNumber ?? "").replace(/[^\d+]/g, ""), 20), plate: cut(p.vehicleNo ?? p.plateNo ?? p.vehicle?.plateNo, 20) } } : {}),
  });
  return { ok: true };
}
/* 🧪 测试账号专用：假装 Delyva 发来骑手状态（正式账号一律拒绝，不会碰到真单） */
const SIM_CODES = [200, 400, 500, 600, 700, 475, 650];
async function simulate(id: number, code: number) {
  if (DCODE.toLowerCase() !== "trydx") throw new Error("模拟只限 Delyva 测试账号（trydx）");
  if (!SIM_CODES.includes(code)) throw new Error("不支持的模拟状态");
  const o = await getOrder(id);
  if (!o?.courier_order_id) throw new Error("这张单还没叫骑手");
  return applyStatus({ orderId: o.courier_order_id, statusCode: code, ...(o.courier_tracking ? { consignmentNo: o.courier_tracking } : {}),
    ...(code >= 200 && code !== 475 ? { personnel: { name: "Test Rider（测试骑手）", phone: "0123456789", vehicleNo: "WTEST 123" } } : {}) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method" }, 405);
  const raw = await req.text();
  const isHook = req.headers.has("x-delyvax-hmac-sha256") || req.headers.has("x-delyvax-event") || /"consignmentNo"/.test(raw);
  try {
    if (isHook) return await webhook(req, raw);
    let pb: any = {}; try { pb = JSON.parse(raw || "{}"); } catch { /* */ }
    if (pb && pb.action === "quote") return json(req, await publicQuote(req, pb));   // 客人报价不用登录
    const by = await staffEmail(req);
    if (!by) return json(req, { error: "请用店员账号登录" }, 401);
    let body: any = {}; try { body = JSON.parse(raw || "{}"); } catch { /* */ }
    const id = Number(body.id);
    if (body.action === "dispatch") return json(req, await dispatch(id, by));
    if (body.action === "cancel") return json(req, await cancel(id, by));
    if (body.action === "setup_webhook") return json(req, await setupWebhook());
    if (body.action === "simulate") return json(req, await simulate(id, Number(body.code)));
    if (body.action === "status") return json(req, { ok: true, version: VERSION, configured: !!(DKEY && DCUST), secret: !!DSECRET, base: DBASE, company: DCODE });
    return json(req, { error: "unknown action" }, 400);
  } catch (e) {
    const msg = String((e as Error)?.message || e).slice(0, 300);
    if (!isHook) {
      try { const b = JSON.parse(raw || "{}"), id = Number(b.id); if (id && b.action !== "simulate") await patchOrder(id, { courier_error: msg }); } catch { /* */ }
    }
    return json(req, { error: msg }, 400);
  }
});
