// Офлайн-кэш. При обновлении рецептов увеличьте номер версии.
const CACHE = "cocktails-v8";
const CORE = ["./", "index.html", "manifest.json", "icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate" || req.url.endsWith(".html");

  if (isPage) {
    // Страница: сначала сеть (чтобы видеть обновления), без сети — из кэша
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }

  // Фото и остальное: сначала кэш, потом сеть
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => new Response("", { status: 404 }))));
});
