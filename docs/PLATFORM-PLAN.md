# MenuBoard — Platform Planı (v0.1)

> Bu doküman, `menuboard.com.tr` platformunun vizyon + mimari + kararlarını tutar.
> Windows'tan **Ubuntu'ya geçiş** sırasında bağlam kaybolmasın diye yazıldı; yaşayan belgedir, konuştukça güncellenir.
> Tarih: 2026-11-04.

## 1. Vizyon
`menuboard.com.tr` — İlgen/NTX'in **yan markası**. **Çok-POS'lu dijital menü-panosu platformu.** Ürünler hangi POS'ta tutuluyorsa oradan akar; TV/panolar bu platformdan beslenir. Değer önermesi: **"sıfır tasarım derdi, sıfır ekstra maliyet, hep taze ve işletmeye özel pano."**

## 2. Hedef kitle (şimdilik)
Küçük işletmeler, **1–birkaç şubeli**: ☕ kafeler, 🍔 hamburgerciler, 🥙 dönerciler, 🍺 barlar.

## 3. Çözülen asıl problem
İşletmeler ekran içeriğinin **tasarımında zorlanıyor**; tasarımcıya **para vermek istemiyor**, uğraşmak istemiyor. Platform, **otomatik/şablonla** işletmeye özel, birbirinin aynısı olmayan tasarımları **ekstra maliyet olmadan** üretmeli.

## 4. Ürün özellikleri
### 4.1 Tasarım kataloğu + ücretlendirme
- **Taban (ön tanımlı):** Her sektör kolu için **~25 hazır tasarım** → "seç-çalıştır", ücretsiz/dahil.
- **Premium (tek seferlik ek ücret):** Hareketli/animasyonlu, markaya daha iyi oturan özel tasarımlar.
- Tasarımlar işletmenin **logo/renk/menüsüyle** kişiselleşir.

### 4.2 Etkinlik motoru (otomatik tema)
Pano, özel günlerde otomatik olarak kutlama temasına geçer:
- 📅 **Özel günler:** milli bayramlar (23 Nisan, 19 Mayıs, 30 Ağustos, 29 Ekim, 15 Temmuz…), **çoklu-inanç** dini bayramlar (Müslüman: Ramazan/Kurban/kandiller; Hristiyan: Noel/Paskalya; Yahudi: Hanuka/Pesah…), **yılbaşı**, **11.11** vb.
- ⚽🏀🏐 **Spor:** milli maçlar (tüm branşlar — öne çıkan), futbol derbileri, lig/kupa, **basketbol & voleybol**; özellikle **Türk Milli Takımı** temaları.

### 4.3 Player (oynatıcı)
- **Tek mod:** menü/içerik panosu. Zekâ sunucuda, Player ince istemci.
- **Sıramatik (opsiyonel):** Ayrı mod değil — **panelden "aktif"** edilir. Menü gösterilmeye devam ederken **altta şerit/bant** şeklinde sıra numaraları akar (sesli anons). Menüyü bozmaz. (Sıramatik + sesli anons altyapısı daha önce yapılmıştı.)

### 4.4 Çok ekranlı dağıtım (video wall) — EN KRİTİK
- Bir tasarım **tek parça değil**, örn. **4 ekranlık bütün**. Her Player kendi **dilimini** gösterir; hepsi **aynı anda, hizalı** çalışır.
- Dizilim: 1×N, 2×2 vb. Her Player panelden konumlanır ("4'ün 2. ekranı").
- **Senkron sırrı:** "tek beyin, çok çıkış" → senkron bedava. Çok cihaz zorunluysa **sunucu zaman damgası** (ortak başlangıç anı) ile hizalama. **Bezel** (çerçeve payı) hesaba katılır.

## 5. POS Entegrasyonu
| Müşteri | Yöntem | Durum |
|---|---|---|
| **POS PAYMENTS** | Doğal — mevcut REST API | ✅ altyapı hazır |
| **ArtıPOS** | Doğal — arti backend `:3001` (`variables.isVisibleOnKiosk=true`, `pricing.basePrice.price`, görsel `QpR`) | ✅ altyapı hazır |
| **SQL tabanlı diğer POS** | **Bağlantı applet'i** — yerelde DB okur, platforma push | 🔜 |
| **Cloud tabanlı POS** | **Bağlantı applet'i** — onların bulut API'si → platform | 🔜 |

### 5.1 Mimari karar — CLOUD-FIRST (2026-11-06, KİLİTLİ)
**Her şey bulutta.** Gerekçe: karmaşıklık kalkar + yönetim kolaylaşır.
- Akış: `[POS] → [Connector: normalize + PUSH] → [menuboard.com.tr bulut: veri + tasarım + olay motoru + compose + yönetim] → [Player: bulut URL'sini açar]`
- **Player = ince istemci:** cihaza özel bir **bulut URL'si** açan Chromium kiosk; POS protokolü/yerel keşif yok. Pi, Android, Samsung SSSP URL Launcher — hepsinde aynı.
- **Connector'lar artık PUSH ajanı:** ArtıPOS/POS PAYMENTS dahil hepsi kiosk-seçili ürünleri buluta **yollar** (Player artık `:3001`'i doğrudan okumaz; connector bu API'yi okuyup push eder).
- **ZORUNLU güvence — offline cache:** Player son servis edilen içeriği (tasarım+veri+video) **yerelde önbelleğe** alır; internet kesilince **son haliyle gösterime devam eder** (fiyat güncellemesi bağlanınca gelir). Menü panosu için yeterli (Yodeck modeli).

## 6. Donanım kararı — KİLİTLİ
**Raspberry Pi 5 (ana/referans) + Raspberry Pi 4 (ucuz giriş).**
- **Pi5:** HEVC **HW** decode + güçlü CPU (H264'ü yazılımda çözer); animasyon/WebGL rahat.
- **Pi4:** **H264 HW** decode; 1080p menü + video yeterli. **WebGL var** (VideoCore VI, GLES 3.1, WebGL 2.0) — orta seviye motion-grafik döner.
- **Elenenler (şimdilik):** Orange Pi 5 / RK3588 (güçlü ama yazılım olgunluğu/tedarik; ileride "pro/wall" olabilir), Tizen (sadece Samsung **Smart Signage/SSSP URL Launcher** ileride "kutusuz premium" olabilir; tüketici TV sideload = hedef değil).

### 6.1 Çözünürlük
- **Hedef 1080p** (4K gerekli değil). 4K TV, 1080p sinyali **upscale** eder → küçülmez, sadece bir tık yumuşar.
- "Küçük kalma" riski sadece **sabit px** tasarımdan çıkar → Player **viewport-oransal (vw/vh/%)** yazılacak, her çözünürlükte ekranı doldurur.

### 6.2 Video / codec stratejisi
- **Sunucuda normalize (ffmpeg):** Müşteri ne yüklerse (Costa Cafe örn. kendi MP4'ü) sunucu **cihaza-dost tek profile** çevirir → her zaman HW decode, garantili akıcı. Düşük bitrate = offline cache dostu.
  - **Pi5 → HEVC 1080p**, **Pi4 → H264 1080p** (ikisi de HW).
- **Animasyon = CSS/SVG/WebGL öncelikli** (decode yok, her Pi'de döner). Gerçek video = HEVC/H264 HW + **yerel önbellek**.
- ⚠️ Doğrulanacak: **Chromium içinde** HEVC HW decode (Pi5) her zaman otomatik değil → `chrome://media-internals` ile test; değilse (a) o sınıfa H264 gönder/CPU, (b) **mpv overlay** ile video, menü üstte.

## 7. MenuBoard OS (kendi Linux imajımız)
Klavye/mouse **hiç gerekmeden** çalışan appliance (Yodeck disiplini).
- **Taban:** Raspberry Pi OS **Lite 64-bit**. Açılışta **doğrudan Chromium kiosk** → Player (cage/weston-kiosk veya X+openbox, systemd servisi).
- **Ajan servisi:** eşleme, config çekme, WiFi onboarding, heartbeat, uzaktan komut, **OTA güncelleme**, **watchdog** (Chromium/sistem çökerse toparla).
- **Klavyesiz ilk kurulum:** (1) ekranda **eşleme kodu** → telefondan panele gir → cihaz config'ini sunucudan çeker; (2) ağ yoksa **geçici WiFi hotspot/captive portal** → telefonla WiFi ver; (3) alternatif Ethernet veya SD'yi önceden WiFi'li yaz.
- **Dükkân dayanıklılığı:** **overlay/read-only kök** (elektrik kesintisinde SD bozulmaz), watchdog + auto-recovery.
- **Üretim:** **pi-gen** / `rpi-image-gen` ile tanımla; **GitHub Actions**'ta `.img` derle (APK gibi). Kullanıcı SD'ye yazıp (Raspberry Pi Imager) Pi'yi açar; iterasyon flash+boot ile.

## 8. Build / altyapı
- GitHub hesabı **ilkerilgen**. APK için örnek: public repo `ilkerilgen/menuboard-tv`, GitHub Actions, otomatik güncelleme.
- **Çalışma ortamı: Ubuntu'ya geçiliyor** (pi-gen Linux ister; Windows'ta native çalışmaz). Windows makinesi de duruyor (disk büyütülecek). İmajın "resmi" üretimi yine **CI'da** (tekrarlanabilir); Ubuntu yerel hızlı iterasyon/flash/test için.

## 9. Mevcut varlıklar
- **TV App (Faz 1, bitti):** `menuboard-tv` — Android TV kiosk, statik GURME KASAP menü tasarımı (gömülü fontlar, çift yön), ekran-açık, boot-otomatik, dikey/yatay seçimi, GitHub Releases oto-güncelleme, POSSAFE IP keşfi + `:3001` API altyapısı. APK: `ilkerilgen/menuboard-tv` Releases `v1`.
  - Bu, Pi tabanlı web Player'a taşınacak statik tasarımın temeli. Player web olduğu için Pi Chromium'da da aynı çalışır.

## 10. Açık sorular (cevaplanacak)
1. Özel-gün/spor teması **tüm ekranı mı** kaplasın yoksa menü üstü **şerit/köşe** kutlaması mı?
2. Takvim **otomatik mi** geçsin, işletme **onayıyla mı**?
3. Çoklu-inanç günlerinde işletme **hangi setleri göstereceğini seçebilsin mi**?
4. ✅ ÇÖZÜLDÜ (2026-11-06) → bkz. §5.1 **CLOUD-FIRST** (POS → connector push → bulut; Player bulut URL + offline cache).
5. Applet'ler sadece **ürün+fiyat** mı, yoksa stok/kampanya da mı gönderir?
6. Abonelik/çoklu-şube/marka yönetimi paneli kapsamı?
7. Çoğunluk kaç ekran olacak (2 mi, 4+ duvar sık mı)? Bezel/boyut standart mı?

## 11. Yol haritası (taslak)
- **Faz 1 (bitti):** Statik menü Player (TV app).
- **Faz 2:** Player'ı **web + viewport-oransal** yap; `:3001` API'den canlı veri (kiosk-seçili ürünler).
- **Faz 3:** **MenuBoard OS** (Pi imajı) — kiosk + ajan + zero-touch pairing + OTA + CI .img.
- **Faz 4:** Platform/panel (menuboard.com.tr) — cihaz yönetimi, tasarım kataloğu, eşleme.
- **Faz 5:** Etkinlik motoru (özel gün + spor takvimi) + tasarım otomasyonu.
- **Faz 6:** Çok-ekran wall (dilimleme + senkron).
- **Faz 7:** Sıramatik şeridi (sesli).
- **Faz 8:** SQL + Cloud bağlantı applet'leri.
- **Faz 9:** Video pipeline (sunucu normalize + yerel cache).
