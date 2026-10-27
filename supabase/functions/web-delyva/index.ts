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
//   WEB_DELYVA_SERVICE       想固定用哪个骑手服务（服务代码或名字的一部分）；不填 = 选最便宜的
//   WEB_DELYVA_BASE          默认 https://api.delyva.app/v1.0
//   WEB_DELYVA_PICKUP_MIN    下单后几分钟让骑手来取，默认 15
//
// 店员（admin.html，带登录）：POST {action:"dispatch"|"cancel"|"setup_webhook"|"status", id?}
// Delyva webhook：POST（header X-Delyvax-Hmac-Sha256 / X-Delyvax-Event）
// API 格式照 Delyva 官方 WooCommerce 插件（github.com/delyva/wp-delyvax）。
// =====================================================================

const VERSION = "2026-10-28a";   // 改程序就改这个，员工后台会显示，方便确认部署的是哪一版
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
const patchOrder = (id: number, patch: Record<string, unknown>) =>
  db(`web_orders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ ...patch, courier_updated_at: new Date().toISOString() }) });

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
async function dv(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
  const r = await fetch(DBASE + path, {
    method,
    headers: { "content-type": "application/json", "X-Delyvax-Access-Token": DKEY, ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
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

  const d = o.dest, dpc = postcodeOf(d.address), dState = stateFromPostcode(dpc), oState = STATE[out.state] || stateFromPostcode(out.postcode);
  const items = Math.max(1, Number(d.items) || 1), weight = Math.min(20, Math.max(1, Math.round(items * 0.6 * 10) / 10));
  const senderPhone = phoneMY(out.phone || SENDER_PHONE);
  if (!senderPhone) throw new Error("还没设定分店电话（web_outlets.phone 或 WEB_DELYVA_SENDER_PHONE）");

  // 1) 报价，选服务。FOOD 没有服务就改 PARCEL 再问；都没有就不指定服务，让 Delyva 自己选
  const quote = (itemType: string) => dv("POST", "/service/instantQuote/", {
    customerId: Number(DCUST),
    origin: { address1: out.address, address2: "", city: out.city || "", state: oState, postcode: out.postcode || "", country: "MY", coord: { lat: out.lat, lon: out.lng } },
    destination: { address1: d.address, address2: d.unit || "", city: cityOf(d.address, dpc), state: dState, postcode: dpc, country: "MY", coord: { lat: d.lat, lon: d.lng } },
    weight: { value: weight, unit: "kg" },
    itemType,
  });
  const listOf = (q: any): any[] => {
    const c = q?.data?.services ?? q?.services ?? q?.data?.quotes ?? q?.data;
    return Array.isArray(c) ? c.filter((s) => s && (s.service || s.code || s.serviceCode)) : [];
  };
  let itemType = ITEM_TYPE, q: any = await quote(itemType), services = listOf(q), quoteRaw = JSON.stringify(q ?? null).slice(0, 160);
  if (!services.length && itemType !== "PARCEL") { itemType = "PARCEL"; q = await quote(itemType); services = listOf(q); }
  const code = (s: any) => s?.service?.serviceCompany?.companyCode || s?.service?.code || s?.serviceCode || s?.code;
  const price = (s: any) => Number(s?.price?.amount ?? s?.price ?? 1e9);
  const pick = services.length ? ((PREF_SERVICE && services.find((s) => [code(s), s?.service?.code, s?.service?.name, s?.name].some((v) => String(v || "").toLowerCase().includes(PREF_SERVICE))))
    || services.slice().sort((a, b) => price(a) - price(b))[0]) : null;

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
    courier_service: String(pick?.service?.name || pick?.name || (pick ? code(pick) : "Delyva 自动选择") || "").slice(0, 80), courier_fee: fee, courier_status: 100,
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
  } else if (!DCUST || Number(data?.customerId) !== Number(DCUST)) {
    return json(req, { error: "customer mismatch" }, 401);      // 没设定 secret 时退而求其次：核对 customerId
  }
  return json(req, await applyStatus(data));
}
/* 把一笔 Delyva 状态写进订单（真的 webhook 和测试模拟共用同一段） */
async function applyStatus(data: any) {
  const delyvaId = String(data?.orderId ?? data?.id ?? "");
  const code = Number(data?.statusCode);
  if (!delyvaId || !Number.isFinite(code)) return { ok: true, ignored: true };
  const rows = await db(`web_orders?courier_order_id=eq.${encodeURIComponent(delyvaId)}&select=id,courier_status`);
  if (!rows.length) return { ok: true, unknown: true };    // 不是网站叫的单
  const p = data?.personnel;
  await patchOrder(rows[0].id, {
    courier_status: code,
    ...(data?.consignmentNo ? { courier_tracking: String(data.consignmentNo) } : {}),
    ...(p ? { courier_rider: { name: p.name ?? null, phone: p.phone ?? p.contactNumber ?? null, plate: p.vehicleNo ?? p.plateNo ?? p.vehicle?.plateNo ?? null } } : {}),
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
  return applyStatus({ orderId: o.courier_order_id, statusCode: code,
    ...(code >= 200 && code !== 475 ? { personnel: { name: "Test Rider（测试骑手）", phone: "0123456789", vehicleNo: "WTEST 123" } } : {}) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method" }, 405);
  const raw = await req.text();
  const isHook = req.headers.has("x-delyvax-hmac-sha256") || req.headers.has("x-delyvax-event") || /"consignmentNo"/.test(raw);
  try {
    if (isHook) return await webhook(req, raw);
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
