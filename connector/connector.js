/* ArtıPOS / POS PAYMENTS → MenuBoard Cloud connector (bağımlılıksız Node 18+)
 *
 * Kiosk için seçilmiş ürünleri (variables.isVisibleOnKiosk=true) POS :3001 API'sinden okur,
 * standart MenuBoard feed'ine çevirir ve buluta push eder (POST /api/device/:id/products).
 * Mimari: [POS] -> [BU connector] -> [bulut] -> [Player]. (CLOUD-FIRST, §5.1)
 *
 * Çalıştırma (örnek):
 *   DEVICE_ID=<eşli-cihaz-id> POS_BASE=http://localhost:3001 \
 *   CLOUD_BASE=https://menubord.com.tr node connector.js
 */
"use strict";

const POS = (process.env.POS_BASE || "http://localhost:3001").replace(/\/$/, "");
const CLOUD = (process.env.CLOUD_BASE || "http://localhost:4000").replace(/\/$/, "");
const DEVICE = process.env.DEVICE_ID || "";
const INTERVAL = parseInt(process.env.INTERVAL_MS || "30000", 10);
const TOKEN = process.env.POS_TOKEN || ""; // genelde gerekmez (LAN'da açık API)

if (!DEVICE) { console.error("HATA: DEVICE_ID gerekli (eşlenmiş cihazın id'si)."); process.exit(1); }
if (typeof fetch !== "function") { console.error("HATA: Node 18+ gerekli (global fetch)."); process.exit(1); }

function headers() { const h = { Accept: "application/json" }; if (TOKEN) h.Authorization = "Bearer " + TOKEN; return h; }
async function getJSON(url) {
  const r = await fetch(url, { headers: headers() });
  if (!r.ok) throw new Error(url + " → HTTP " + r.status);
  return r.json();
}

function fmtPrice(n) {
  if (n == null || isNaN(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}
function unitLabel(u) {
  u = String(u || "").toLowerCase();
  if (u === "kg" || u === "kilogram") return "KG";
  if (u === "gr" || u === "gram") return "GR";
  if (u === "lt" || u === "litre") return "LT";
  return "ADET";
}
function iconFor(name) {
  const n = String(name || "").toLowerCase();
  if (/dana|et|biftek|antrikot|bonfile|k[ıi]yma|k[ıi]rm[ıi]z[ıi]/.test(n)) return "beef";
  if (/kuzu|otlak|[çc]iftlik|tavuk|kanatl[ıi]/.test(n)) return "grass";
  if (/kahve|i[çc]ecek|so[ğg]uk|s[ıi]cak|[çc]ay|bar|me[şs]rubat/.test(n)) return "skillet";
  if (/[şs]ark[üu]teri|sucuk|salam|k[öo]fte|mahzen/.test(n)) return "skillet";
  return "beef";
}

async function buildFeed() {
  const catsRes = await getJSON(`${POS}/categories?page=1&limit=9999&type=product&sort=order:asc`);
  const prodRes = await getJSON(`${POS}/products?page=1&limit=99999&variables.isVisibleOnKiosk=true&view=list&skipCounts=true&sort=order:asc`);
  const cats = catsRes.data || [];
  const prods = prodRes.data || [];

  const catMap = {};
  cats.forEach(c => { catMap[String(c._id)] = { name: c.name, order: c.order || 0 }; });

  const groups = {};
  prods.forEach(p => {
    const cid = String(p.category || "");
    const info = catMap[cid] || { name: "Diğer", order: 999 };
    const g = groups[cid] || (groups[cid] = { name: info.name, order: info.order, unit: unitLabel(p.unit), rows: [] });
    g.rows.push({
      name: p.name || "",
      sub: p.description || p.productOrigin || "",
      price: fmtPrice(p.pricing && p.pricing.basePrice ? p.pricing.basePrice.price : 0),
      _order: p.order || 0
    });
  });

  const categories = Object.values(groups)
    .sort((a, b) => a.order - b.order)
    .map(g => ({
      title: g.name,
      icon: iconFor(g.name),
      unit: g.unit,
      rows: g.rows.sort((a, b) => a._order - b._order).map(r => ({ name: r.name, sub: r.sub, price: r.price }))
    }));

  return { categories };
}

async function push(feed) {
  const r = await fetch(`${CLOUD}/api/device/${DEVICE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feed)
  });
  if (!r.ok) throw new Error("push → HTTP " + r.status);
  return r.json();
}

async function tick() {
  try {
    const feed = await buildFeed();
    const n = feed.categories.reduce((s, c) => s + c.rows.length, 0);
    await push(feed);
    console.log(new Date().toISOString(), `push OK — ${feed.categories.length} kategori, ${n} ürün`);
  } catch (e) {
    console.error(new Date().toISOString(), "hata:", e.message);
  }
}

console.log(`ArtıPOS connector → POS=${POS}  CLOUD=${CLOUD}  DEVICE=${DEVICE}  her ${INTERVAL / 1000}s`);
tick();
setInterval(tick, INTERVAL);
