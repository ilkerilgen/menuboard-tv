/* MenuBoard Player — Service Worker
 * Offline-first: kabuk + fontlar cache-first; içerik (content.json) network-first + cache fallback.
 * İnternet kesilince son servis edilen tasarım+veri gösterilmeye devam eder. */
var CACHE = "menuboard-player-v1";
var CORE = [
  "./",
  "index.html",
  "player.css",
  "player.js",
  "content.json",
  "fonts/Oswald.ttf",
  "fonts/SpaceGrotesk.ttf",
  "fonts/WorkSans.ttf"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var isContent = url.pathname.endsWith("content.json");

  if (isContent) {
    // network-first: taze içerik al, kopyasını cache'e yaz; offline'da cache'ten ver
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put("content.json", copy); });
        return res;
      }).catch(function () {
        return caches.match("content.json");
      })
    );
    return;
  }

  // kabuk + fontlar + diğer: cache-first, yoksa ağdan al ve cache'le
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.ok && (url.origin === location.origin)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return caches.match("index.html"); });
    })
  );
});
