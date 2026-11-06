/* MenuBoard Cloud — MVP backend (bağımlılıksız Node http)
 *
 * Mimari (CLOUD-FIRST):
 *   [POS] -> connector push -> [BU SUNUCU: cihaz + içerik] -> [Player bulut URL'sini açar]
 *
 * Uçlar:
 *   POST /api/device/register          -> yeni cihaz (id + 6 haneli eşleme kodu)
 *   GET  /api/device/:id/content       -> cihazın içeriği (eşli değilse {paired:false, code})
 *   POST /api/pair    {code,name,orientation} -> cihazı eşle, şablon içerik ata
 *   POST /api/device/:id/products {categories,featured?} -> connector push (ürünleri güncelle)
 *   POST /api/device/:id/config   {orientation?,business?,event?,ticker?} -> cihaz ayarı
 *   GET  /api/devices                  -> cihaz listesi (admin)
 *
 * Ayrıca Player'ı aynı origin'den servis eder (config.js bulut moduna çevrilir) ve /admin paneli.
 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 4000;
const ROOT = __dirname;
const PLAYER_DIR = path.join(ROOT, "..", "player");
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// ---- Varsayılan içerik şablonu (Player'ın örnek content.json'u) ----
let DEFAULT_CONTENT = {};
try { DEFAULT_CONTENT = JSON.parse(fs.readFileSync(path.join(PLAYER_DIR, "content.json"), "utf8")); }
catch (e) { console.warn("content.json okunamadı, boş şablon:", e.message); }

// ---- Basit kalıcı JSON depo ----
let db = { devices: {} };
function loadDB() {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch (e) { db = { devices: {} }; }
  if (!db.devices) db.devices = {};
}
function saveDB() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
  catch (e) { console.error("DB yazılamadı:", e.message); }
}

function newCode() {
  let code;
  const used = new Set(Object.values(db.devices).filter(d => !d.paired).map(d => d.code));
  do { code = String(crypto.randomInt(100000, 1000000)); } while (used.has(code));
  return code;
}
function seededContent(name, orientation) {
  const c = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  c.orientation = orientation || "auto";
  if (name) { c.business = c.business || {}; c.business.name = name; }
  return c;
}

// ---- HTTP yardımcıları ----
const MIME = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function sendJSON(res, code, obj) {
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function sendFile(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) { cors(res); res.writeHead(404); res.end("not found"); return; }
    cors(res);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(buf);
  });
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = ""; req.on("data", c => { data += c; if (data.length > 2e6) req.destroy(); });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}
function safePlayerPath(urlPath) {
  const rel = urlPath.replace(/^\/+/, "");
  const full = path.normalize(path.join(PLAYER_DIR, rel));
  if (!full.startsWith(PLAYER_DIR)) return null; // path traversal koruması
  return full;
}

// ---- Sunucu ----
loadDB();
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const p = u.pathname;
  const method = req.method;

  if (method === "OPTIONS") { cors(res); res.writeHead(204); res.end(); return; }

  // ---------- API ----------
  if (p === "/api/device/register" && method === "POST") {
    const id = crypto.randomUUID();
    db.devices[id] = { id, code: newCode(), paired: false, name: null, createdAt: Date.now(), content: null };
    saveDB();
    return sendJSON(res, 200, { id, code: db.devices[id].code, paired: false });
  }

  let m;
  if ((m = p.match(/^\/api\/device\/([^/]+)\/content$/)) && method === "GET") {
    const d = db.devices[m[1]];
    if (!d) return sendJSON(res, 404, { error: "device_not_found" });
    if (!d.paired) return sendJSON(res, 200, { paired: false, code: d.code });
    return sendJSON(res, 200, d.content || seededContent(d.name, "auto"));
  }

  if (p === "/api/pair" && method === "POST") {
    const body = await readBody(req);
    const code = String(body.code || "").trim();
    const d = Object.values(db.devices).find(x => x.code === code && !x.paired);
    if (!d) return sendJSON(res, 404, { error: "code_not_found" });
    d.paired = true;
    d.name = body.name || "İşletme";
    d.orientation = body.orientation || "auto";
    d.content = seededContent(d.name, d.orientation);
    d.pairedAt = Date.now();
    saveDB();
    return sendJSON(res, 200, { ok: true, id: d.id, name: d.name });
  }

  if ((m = p.match(/^\/api\/device\/([^/]+)\/products$/)) && method === "POST") {
    const d = db.devices[m[1]];
    if (!d || !d.paired) return sendJSON(res, 404, { error: "device_not_found_or_unpaired" });
    const body = await readBody(req);
    d.content = d.content || seededContent(d.name, d.orientation);
    if (Array.isArray(body.categories)) d.content.categories = body.categories;
    if (body.featured) d.content.featured = body.featured;
    d.updatedAt = Date.now();
    saveDB();
    return sendJSON(res, 200, { ok: true });
  }

  if ((m = p.match(/^\/api\/device\/([^/]+)\/config$/)) && method === "POST") {
    const d = db.devices[m[1]];
    if (!d || !d.paired) return sendJSON(res, 404, { error: "device_not_found_or_unpaired" });
    const body = await readBody(req);
    d.content = d.content || seededContent(d.name, d.orientation);
    if (body.orientation) { d.orientation = body.orientation; d.content.orientation = body.orientation; }
    if (body.business) d.content.business = Object.assign({}, d.content.business, body.business);
    if ("event" in body) d.content.event = body.event;
    if ("ticker" in body) d.content.ticker = body.ticker;
    d.updatedAt = Date.now();
    saveDB();
    return sendJSON(res, 200, { ok: true });
  }

  if (p === "/api/devices" && method === "GET") {
    const list = Object.values(db.devices).map(d => ({
      id: d.id, code: d.code, paired: !!d.paired, name: d.name || null,
      orientation: d.orientation || "auto", updatedAt: d.updatedAt || d.pairedAt || d.createdAt
    }));
    return sendJSON(res, 200, { devices: list });
  }

  // ---------- Statik ----------
  if (method === "GET") {
    if (p === "/config.js") { // Player'ı bulut moduna çevir
      cors(res);
      res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" });
      return res.end('window.MB_CLOUD = "/";\n');
    }
    if (p === "/admin" || p === "/admin/") return sendFile(res, path.join(PUBLIC_DIR, "admin.html"));
    if (p === "/") return sendFile(res, path.join(PLAYER_DIR, "index.html"));
    const fp = safePlayerPath(p);
    if (fp) return sendFile(res, fp);
  }

  cors(res); res.writeHead(404); res.end("not found");
});

server.listen(PORT, () => {
  console.log("MenuBoard Cloud çalışıyor:  http://localhost:" + PORT);
  console.log("  Player : http://localhost:" + PORT + "/");
  console.log("  Admin  : http://localhost:" + PORT + "/admin");
});
