/* MenuBoard Player — ince istemci
 * content.json (ileride buluttan) yüklenir, tasarım sabit kanvasa çizilip ekrana ölçeklenir.
 * Offline: service worker içeriği önbelleğe alır, internet kesilince son hali gösterilir. */
(function () {
  "use strict";

  var CONTENT_URL = "content.json"; // ileride: cihaza-özel bulut URL'si
  var REF = { landscape: [1920, 1080], portrait: [1080, 1920] };

  var ICONS = {
    emblem: '<path d="M4 7l5-3 5 3M4 7v10l5 3 5-3V7M4 7l5 3 5-3"/><path d="M9 10v10"/>',
    star: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',
    shield: '<path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    beef: '<path d="M4 4v7a3 3 0 003 3v6M7 4v7M10 4v7M18 4c1.5 1 2 3 2 5s-.5 4-2 5v4"/>',
    grass: '<path d="M12 20c0-5 0-8 3-11M12 20c0-5 0-8-3-11M12 20c0-4 0-7 0-11M6 6c0-1.5 1-2 1.5-1S8 7 7 8M18 6c0-1.5-1-2-1.5-1S16 7 17 8"/>',
    skillet: '<path d="M4 14a6 6 0 0012 0v-1H4zM16 13h3a2 2 0 010 4h-2M7 9c0-1 .5-1.5 0-2.5M11 9c0-1 .5-1.5 0-2.5"/>',
    service: '<path d="M4 18h16M6 18v-2a6 6 0 0112 0v2M12 7V4M9 4h6"/>',
    knife: '<path d="M3 7l14 14 4-4L7 3zM14 8l2 2M11 11l2 2M8 14l2 2"/>',
    snow: '<path d="M12 2v20M4 7l16 10M20 7L4 17M12 2l3 3M12 2L9 5"/>',
    premium: '<path d="M12 3l2 4 4 .5-3 3 .8 4.5L12 13l-3.8 2 .8-4.5-3-3 4-.5z"/><path d="M8 20h8"/>',
    check: '<path d="M12 21a9 9 0 100-18 9 9 0 000 18zM8 12l3 3 5-5"/>'
  };
  function svg(name, cls) {
    return '<svg viewBox="0 0 24 24" class="ic ' + (cls || "") + '">' + (ICONS[name] || "") + "</svg>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
    });
  }

  var MONTHS = ["OCAK","ŞUBAT","MART","NİSAN","MAYIS","HAZİRAN","TEMMUZ","AĞUSTOS","EYLÜL","EKİM","KASIM","ARALIK"];
  var DAYS = ["PAZAR","PAZARTESİ","SALI","ÇARŞAMBA","PERŞEMBE","CUMA","CUMARTESİ"];
  function pad(n){ return (n<10?"0":"")+n; }

  function render(c) {
    var o = (new URLSearchParams(location.search).get("o")) || c.orientation || "auto";
    if (o !== "portrait" && o !== "landscape") o = (window.innerWidth >= window.innerHeight) ? "landscape" : "portrait";
    document.documentElement.setAttribute("data-orient", o);
    var ref = REF[o];
    document.documentElement.style.setProperty("--cw", ref[0] + "px");
    document.documentElement.style.setProperty("--ch", ref[1] + "px");

    var b = c.business || {}, st = c.status || {}, f = c.featured || {}, s = c.services || {}, ft = c.footer || {};
    var html = "";

    // olay (özel gün / spor) üst şeridi
    if (c.event && c.event.message) {
      html += '<div class="event on"><span class="msg">' + esc(c.event.message) + '</span></div>';
    }

    // header
    html += '<div class="hdr"><div class="brand">' +
      '<div class="emblem">' + svg("emblem") + '</div>' +
      '<div class="brand-txt"><div class="brand-row1">' +
        '<span class="brand-name">' + esc(b.name) + '</span>' +
        (b.sub ? '<span class="brand-sep">&amp;</span><span class="brand-sub2">' + esc(b.sub) + '</span>' : '') +
      '</div><div class="brand-row2">' +
        (b.live ? '<span class="lbl pill-live">' + esc(b.live) + '</span><span class="dot"></span>' : '') +
        (b.badge ? '<span class="lbl chip-fresh">' + esc(b.badge) + '</span>' : '') +
      '</div></div></div>' +
      '<div class="clock"><span class="t" id="ck-t">--:--</span><span class="d lbl" id="ck-d">—</span></div></div>';

    // wrap
    html += '<div class="wrap">';

    // statusbar
    html += '<div class="statusbar"><div class="left"><span class="blink"></span>' +
      '<span class="lbl">' + esc(st.left) + '</span></div>' +
      '<div class="badge-vet">' + svg("shield") + '<span class="lbl">' + esc(st.right) + '</span></div></div>';

    // hero
    if (f.items && f.items.length) {
      html += '<section class="hero"><div class="sec-head" style="margin-bottom:12px;">' +
        '<div class="ttl">' + svg("star") + '<h2 class="h-sm">' + esc(f.title) + '</h2></div>' +
        (f.tag ? '<span class="lbl tag-amber">' + esc(f.tag) + '</span>' : '') + '</div><div class="hero-stack">';
      f.items.forEach(function (it) {
        var badges = (it.badges || []).map(function (x) {
          return '<span class="b ' + esc(x.style || "dark") + '">' + esc(x.text) + '</span>';
        }).join("");
        var tags = (it.tags || []).map(function (x) {
          return '<span class="t-chip' + (x.amber ? " amber" : "") + '">' + esc(x.text) + '</span>';
        }).join("");
        html += '<article class="hero-card"><div class="hero-media">' +
          '<div class="ph" style="background:' + esc(it.tint || "var(--surface-high)") + ';"></div>' +
          '<div class="scrim"></div><div class="hero-badges">' + badges + '</div>' +
          '<div class="hero-price"><span class="lbl cap">Birim Fiyat</span>' +
            '<div class="val"><span class="num">' + esc(it.price) + '</span><span class="unit">' + esc(it.unit || "₺ / kg") + '</span></div>' +
          '</div></div>' +
          '<div class="hero-body"><h3>' + esc(it.name) + '</h3>' +
            '<p class="desc">' + esc(it.desc) + '</p><div class="hero-tags">' + tags + '</div></div></article>';
      });
      html += '</div></section>';
    }

    // matrix
    html += '<section class="matrix">';
    (c.categories || []).forEach(function (cat) {
      html += '<div class="cat"><div class="cat-head"><div class="ttl">' + svg(cat.icon || "beef") +
        '<span>' + esc(cat.title) + '</span></div><span class="lbl unit">Birim: ' + esc(cat.unit || "KG") + '</span></div><div class="cat-body">';
      (cat.rows || []).forEach(function (r) {
        var chip = r.chip ? '<span class="r-chip ' + esc(r.chip.style || "") + '">' + esc(r.chip.text) + '</span>' : "";
        html += '<div class="row"><div class="info"><div class="name-line">' +
          '<span class="name">' + esc(r.name) + '</span>' + chip + '</div>' +
          '<span class="body sub">' + esc(r.sub) + '</span></div>' +
          '<div class="leader"></div>' +
          '<div class="r-price"><span class="num">' + esc(r.price) + '</span><span class="cur">₺</span></div></div>';
      });
      html += '</div></div>';
    });
    html += '</section>';

    // services
    if (s.items && s.items.length) {
      var icons = ["knife", "snow"];
      html += '<section class="services"><div class="ttl">' + svg("service") + '<h3>' + esc(s.title) + '</h3></div><div class="svc-grid">';
      s.items.forEach(function (x, i) {
        html += '<div class="svc">' + svg(icons[i % icons.length], i === 0 ? "prim" : "") +
          '<div><div class="st">' + esc(x.title) + '</div><div class="sp">' + esc(x.desc) + '</div></div></div>';
      });
      html += '</div>';
      if (s.assurance) {
        html += '<div class="assure"><div class="left">' + svg("premium") + '<span class="lbl">' + esc(s.assurance) + '</span></div>' + svg("check") + '</div>';
      }
      html += '</section>';
    }

    html += '</div>'; // /wrap

    // sıramatik şeridi
    if (c.ticker && c.ticker.active) {
      var nums = (c.ticker.numbers || []).map(function (n) { return '<span class="num">' + esc(n) + '</span>'; }).join("");
      html += '<div class="ticker active"><span class="label">' + esc(c.ticker.label || "Sıra No") + '</span>' +
        '<div class="nums">' + nums + nums + '</div></div>';
    }

    // footer
    html += '<div class="ftr"><div class="l">' + svg("check") + '<span class="lbl">' + esc(ft.left) + '</span></div>' +
      '<div class="l"><span class="lbl" style="color:var(--secondary)">kg / paket</span>' +
      (ft.hotline ? '<span class="lbl">Usta Hattı: <span class="hotline">' + esc(ft.hotline) + '</span></span>' : '') + '</div></div>';

    document.getElementById("stage").innerHTML = html;
    scaleStage();
    fitWrap();
    tick();
  }

  // İçerik tek ekranı taşarsa orantılı küçült (her ürün sayısında sığsın)
  function fitWrap() {
    var w = document.querySelector(".wrap");
    if (!w) return;
    w.style.transform = "none";
    var avail = w.clientHeight, need = w.scrollHeight;
    var k = need > avail ? avail / need : 1;
    w.style.transform = k < 1 ? "scale(" + k + ")" : "none";
  }

  function scaleStage() {
    var o = document.documentElement.getAttribute("data-orient") || "landscape";
    var ref = REF[o] || REF.landscape;
    var s = Math.min(window.innerWidth / ref[0], window.innerHeight / ref[1]);
    document.documentElement.style.setProperty("--scale", s);
  }

  function tick() {
    var d = new Date();
    var t = document.getElementById("ck-t"), dd = document.getElementById("ck-d");
    if (t) t.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
    if (dd) dd.textContent = d.getDate() + " " + MONTHS[d.getMonth()] + " " + DAYS[d.getDay()];
  }

  function status(online) {
    var el = document.getElementById("statusdot");
    if (!el) return;
    el.classList.add("show");
    el.classList.toggle("offline", !online);
    setTimeout(function () { el.classList.remove("show"); }, 2500);
  }

  function saveLocal(c) { try { localStorage.setItem("mb_content", JSON.stringify(c)); } catch (e) {} }
  function loadLocal() { try { var s = localStorage.getItem("mb_content"); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

  // ===== Bulut istemcisi (cloud-first) =====
  var params = new URLSearchParams(location.search);
  var CLOUD = params.get("cloud") || window.MB_CLOUD || "";
  if (CLOUD && !/\/$/.test(CLOUD)) CLOUD += "/";
  var DEVKEY = "mb_device_id";
  function devId() { try { return localStorage.getItem(DEVKEY); } catch (e) { return null; } }
  function setDev(id) { try { localStorage.setItem(DEVKEY, id); } catch (e) {} }

  function getJSON(u) { return fetch(u, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function postJSON(u, b) {
    return fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b || {}) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  function setOrientByViewport() {
    var o = (window.innerWidth >= window.innerHeight) ? "landscape" : "portrait";
    document.documentElement.setAttribute("data-orient", o);
    var ref = REF[o];
    document.documentElement.style.setProperty("--cw", ref[0] + "px");
    document.documentElement.style.setProperty("--ch", ref[1] + "px");
    return o;
  }

  function showPairing(code) {
    setOrientByViewport();
    document.getElementById("stage").innerHTML =
      '<div class="pair"><div class="pair-card">' +
      '<div class="pair-emblem"><svg viewBox="0 0 24 24" class="ic">' + ICONS.emblem + '</svg></div>' +
      '<div class="pair-ttl">MENUBOARD</div>' +
      '<div class="pair-sub">Bu ekranı eşlemek için panelde aşağıdaki kodu girin</div>' +
      '<div class="pair-code">' + esc(code) + '</div>' +
      '<div class="pair-host">menuboard.com.tr</div>' +
      '</div></div>';
    scaleStage();
  }

  function applyContent(c) { render(c); saveLocal(c); status(true); }

  function cloudTick() {
    var ensure = devId()
      ? Promise.resolve(devId())
      : postJSON(CLOUD + "api/device/register", {}).then(function (d) { setDev(d.id); return d.id; });
    ensure.then(function (id) {
      return getJSON(CLOUD + "api/device/" + id + "/content");
    }).then(function (data) {
      if (data && data.paired === false) { showPairing(data.code); }
      else { applyContent(data); }
    }).catch(function () {
      var c = loadLocal();
      if (c) { render(c); status(false); }
    });
  }

  function localTick() {
    getJSON(CONTENT_URL).then(function (c) { render(c); saveLocal(c); status(true); })
      .catch(function () { var c = loadLocal(); if (c) { render(c); status(false); } });
  }

  var tickFn = CLOUD ? cloudTick : localTick;

  window.addEventListener("resize", function () { scaleStage(); fitWrap(); });
  window.addEventListener("online", function () { status(true); tickFn(); });
  window.addEventListener("offline", function () { status(false); });
  setInterval(tick, 15000);
  setInterval(tickFn, CLOUD ? 8000 : 5 * 60 * 1000); // bulut modunda sık poll (eşleme + güncelleme)
  tickFn();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
