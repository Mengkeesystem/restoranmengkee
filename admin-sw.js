/* 员工后台 App 的 service worker（2026-10-31）：让手机可以「安装」成 App。
   订单资料一律直接向 Supabase 拿，不存进手机（不缓存任何 API / 订单）。
   只把后台页面本身和图标存一份：没网络时打开 App 至少看得到「没有网络」的画面，不会一片白。 */
const CACHE = "mk-admin-v1";
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
