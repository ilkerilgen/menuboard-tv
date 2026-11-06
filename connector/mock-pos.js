/* Mock ArtıPOS :3001 — connector'ı gerçek POS olmadan test etmek için.
 * Gerçek API şeklini taklit eder: /categories ve /products ({data:[...]}).
 * "Gizli Ürün" isVisibleOnKiosk=false → connector onu dışlamalı. */
"use strict";
const http = require("http");

const cats = [
  { _id: "c1", name: "Dana Grubu • Yerli Besi", order: 1 },
  { _id: "c2", name: "Kuzu & Doğal Otlak", order: 2 },
  { _id: "c3", name: "Şarküteri & Mahzen", order: 3 }
];

const prods = [
  { name: "Dana Kıyma", description: "%15 Yağlı • Günlük Yemeklik", category: "c1", unit: "kg", order: 1, pricing: { basePrice: { price: 520 } }, variables: { isVisibleOnKiosk: true } },
  { name: "Dana Bonfile", description: "Sıfır Sinir • Madalyon Kesim", category: "c1", unit: "kg", order: 2, pricing: { basePrice: { price: 980 } }, variables: { isVisibleOnKiosk: true } },
  { name: "Dana Kuşbaşı", description: "Tranç & But • Güveçlik", category: "c1", unit: "kg", order: 3, pricing: { basePrice: { price: 560 } }, variables: { isVisibleOnKiosk: true } },
  { name: "Kuzu Pirzola", description: "Doğal Otlak Besi", category: "c2", unit: "kg", order: 1, pricing: { basePrice: { price: 840 } }, variables: { isVisibleOnKiosk: true } },
  { name: "Kuzu Kıyma", description: "Kebaplık • Kokusu Hafif", category: "c2", unit: "kg", order: 2, pricing: { basePrice: { price: 610 } }, variables: { isVisibleOnKiosk: true } },
  { name: "Kasap Sucuğu", description: "Fermente • Doğal Bağırsak", category: "c3", unit: "kg", order: 1, pricing: { basePrice: { price: 639.9 } }, variables: { isVisibleOnKiosk: true } },
  { name: "Gizli Ürün (kiosk kapalı)", description: "panoda görünmemeli", category: "c3", unit: "kg", order: 2, pricing: { basePrice: { price: 1 } }, variables: { isVisibleOnKiosk: false } }
];

http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (u.pathname === "/categories") {
    return res.end(JSON.stringify({ data: cats, total: cats.length }));
  }
  if (u.pathname === "/products") {
    const kioskOnly = u.searchParams.get("variables.isVisibleOnKiosk") === "true";
    const d = kioskOnly ? prods.filter(p => p.variables.isVisibleOnKiosk) : prods;
    return res.end(JSON.stringify({ data: d, total: d.length }));
  }
  res.statusCode = 404; res.end("{}");
}).listen(3001, () => console.log("mock ArtıPOS çalışıyor :3001"));
