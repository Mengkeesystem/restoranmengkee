/* 员工后台 App 的 service worker（2026-10-31）：让手机可以「安装」成 App。
   订单资料一律直接向 Supabase 拿，不存进手机（不缓存任何 API / 订单）。
   只把后台页面本身和图标存一份：没网络时打开 App 至少看得到「没有网络」的画面，不会一片白。 */
const CACHE = "mk-admin-v2";
const SHELL = ["admin.html", "admin.webmanifest", "images/logo.png", "images/app-192.png", "images/app-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;            // Supabase、CDN 等外部请求：不管，直接走网络
  if (r.mode === "navigate" && /admin\.html$|\/$/.test(u.pathname)) {        // 后台页面：先拿最新的，没网络才用存着的那份
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put("admin.html", cp)); return res; })
      .catch(() => caches.match("admin.html")));
    return;
  }
  if (SHELL.some((p) => u.pathname.endsWith("/" + p))) e.respondWith(caches.match(r).then((m) => m || fetch(r)));
});

/* 手机通知（2026-11-02，web-push 函数发来的）：新订单付款成功 / 订单出问题时，就算后台关着、手机锁屏也会响。
   推送内容只有参考号、分店、自取/外送、金额，没有客人资料。iOS 规定「每一次推送都必须显示通知」，所以这里一律显示（不能静默）。 */
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : "" }; }
  const title = String(d.title || "🔔 明记后台").slice(0, 80);
  e.waitUntil(self.registration.showNotification(title, {
    body: String(d.body || "").slice(0, 200), icon: "images/app-192.png", badge: "images/app-192.png",
    tag: String(d.tag || "mk"), renotify: true, requireInteraction: true, vibrate: [200, 100, 200, 100, 300],
    data: { url: "admin.html" },   // 点了一律回后台（不信推送里的网址）
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => /admin\.html/.test(x.url)) || cs[0];
    return c ? c.focus() : self.clients.openWindow("admin.html");
  }));
});
