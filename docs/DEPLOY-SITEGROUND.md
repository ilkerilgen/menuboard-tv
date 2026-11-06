# SiteGround'a Deploy — menubord.com.tr

MenuBoard Cloud backend'i (`cloud/server.js`) SiteGround'da yayınlama. Avantaj:
**sıfır bağımlılık** (npm install YOK) ve `process.env.PORT` kullanır → SiteGround Node (Phusion Passenger) ile birebir uyumlu.

## Ön koşul
- menubord.com.tr DNS'i SiteGround'a yönlendi. ✅
- SiteGround planında **Node.js** desteği (GrowBig / Cloud). SSH önerilir.

## 1) Dosyaları sunucuya al — SSH + git (önerilen)
Site Tools → **Devs → SSH Keys Manager** ile anahtar ekle, sonra SSH bağlan:
```bash
cd ~/www/menubord.com.tr
git clone https://github.com/ilkerilgen/menuboard-tv.git app
```
Güncellemelerde: `cd ~/www/menubord.com.tr/app && git pull` → sonra **Restart** (adım 4).

> Alternatif: Site Tools → **Git** aracı, ya da **File Manager** ile repo zip'ini yükleyip aç.

## 2) Node uygulaması oluştur
Site Tools → **Devs → Node.js** → *Create Application*:
- **Node version:** 20 (en az 18)
- **Project folder:** `www/menubord.com.tr/app` (git clone klasörü)
- **Application URL:** `menubord.com.tr` (ya da alt alan: `panel.menubord.com.tr`)
- **Application startup file:** `app.js`

> SiteGround klasöre örnek `app.js` / `public` / `tmp` koyabilir. Bizim repo zaten `app.js` ve (boş) `public/` içerir — git clone'daki dosyalar geçerli olmalı. `public/` **boş** bırakılır ki tüm istekler Node uygulamasına gitsin (Player'ı uygulama servis eder).

## 3) Bağımlılık
**Yok.** "Run NPM Install" gerekmez.

## 4) Başlat / Restart
Node aracında **Restart** butonu. (SSH ile: `mkdir -p ~/www/menubord.com.tr/app/tmp && touch ~/www/menubord.com.tr/app/tmp/restart.txt`)

## 5) SSL (şart)
Site Tools → **Security → SSL Manager** → menubord.com.tr için **Let's Encrypt** kur, sonra **HTTPS Enforce** aç. Player ve service worker **https** ister.

## 6) Doğrula
- Player : `https://menubord.com.tr/` → **eşleme kodu** görünür.
- Panel  : `https://menubord.com.tr/admin` → cihaz listesi.
- Kontrol: `https://menubord.com.tr/config.js` → `window.MB_CLOUD = "/";`

## 7) Cihazı bağla + connector
- **Ekran (Pi/TV):** tarayıcıyı `https://menubord.com.tr/` aç → kod çıkar → panelden **eşle**.
- **Connector (dükkânda, POS yanında):**
```bash
DEVICE_ID=<eşli-cihaz-id> \
POS_BASE=http://localhost:3001 \
CLOUD_BASE=https://menubord.com.tr \
node connector.js
```

## Notlar / MVP sınırları
- **Depo:** `cloud/data/db.json` (dosya tabanlı). Restart'ta veri diskte kalır. İleride gerçek DB (Postgres/SQLite).
- **Idle uyku:** Shared hosting'de uzun idle'dan sonra Passenger uygulamayı uyutabilir; ilk istekte birkaç saniyede uyanır. Signage'de Player'ın offline cache'i bu anı örter.
- **Kök zorunlu:** Uygulama **domain/subdomain kökünde** çalışmalı; alt yola (`/app`) kurmak mutlak yolları (`/api`, `/config.js`) bozar.
- **Çoklu-cihaz/şube, gerçek DB, hesap/auth:** Faz 4 (devam) kapsamında.
