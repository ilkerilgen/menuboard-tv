# NTX Menü Panosu (Android TV)

Kasap / et marketi için **dijital menü panosu** uygulaması. Android TV'de tam ekran çalışır,
cihaz açılınca otomatik başlar, ekran asla kapanmaz ve GitHub üzerinden kendini günceller.

> **Faz 1 (şu an):** Menü tasarımı **statiktir** (sabit ürünler). POS bağlantısı altyapısı hazır.
> **Faz 2 (sonra):** Ürünler POS'tan (`arti` backend, `:3001`) canlı çekilecek —
> kiosk için seçilmiş (`variables.isVisibleOnKiosk = true`) ürünler gösterilecek.

## Özellikler
- 📱 Android TV + telefon/tablet uyumlu, tam ekran (immersive) kiosk modu
- 🚀 Cihaz açılınca **otomatik başlar** (boot) — ayrıca HOME başlatıcı olarak atanabilir
- 🔆 **Ekran kapanmaz** (`FLAG_KEEP_SCREEN_ON`)
- ↕️↔️ İlk açılışta **Dikey / Yatay** sorar, seçimi hatırlar
- 🔎 Yerel ağda **POSSAFE** sunucusunu (`:3001`) otomatik arar (altyapı hazır)
- 🔄 **Otomatik güncelleme** — GitHub Releases'teki yeni sürümü indirip kurar

## Otomatik güncelleme nasıl çalışır
1. Her `main`'e push'ta GitHub Actions APK derler ve `v<versionCode>` etiketiyle **Release** yayınlar.
2. Uygulama açılışta en son release'in sürümünü kontrol eder; yeni ise APK'yı indirir ve kurar.
3. Cihaz **device owner** ise kurulum **sessiz** olur; değilse ekranda onay çıkar.

Yeni sürüm çıkarmak için `app/build.gradle.kts` içindeki **`versionCode`'u bir artır** ve push et.

## Tamamen sessiz güncelleme (opsiyonel, önerilir)
Dedike menü-panosu TV'sinde kurulumun hiç dokunmadan yapılması için uygulamayı **device owner** yapın.
Cihaz **fabrika ayarlarındayken / hiç Google hesabı eklenmemişken**, USB hata ayıklama açıkken:

```bash
adb install menuboard-v1.apk
adb shell dpm set-device-owner com.ntx.menuboard/com.ntx.menuboard.BootReceiver
```

## Derleme (GitHub Actions — önerilen)
İlk kurulum için repoda şu **secret**'lar tanımlı olmalı (otomatik eklendi):
`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

`main`'e her push APK üretir → **Releases** sekmesinden `.apk` indirilir.

> ⚠️ `keystore/release.jks` imza anahtarıdır, repoya girmez. Güncellemelerin üst üste kurulabilmesi
> için bu anahtar **asla değişmemeli** — yedeğini güvenli bir yerde saklayın.

## Yerel derleme (Android Studio)
Android Studio ile `menuboard-tv` klasörünü açıp `Run` demeniz yeterli (debug imzayla çalışır).

## Proje yapısı
```
app/src/main/
  assets/menuboard.html      → menü tasarımı (offline, çift yön)
  assets/fonts/              → Oswald / Space Grotesk / Work Sans (gömülü)
  java/com/ntx/menuboard/
    MainActivity.kt          → kiosk WebView, ekran-açık, yön
    OrientationActivity.kt   → dikey/yatay seçimi
    BootReceiver.kt          → açılışta otomatik başlatma
    UpdateManager.kt         → GitHub Releases otomatik güncelleme
    PosDiscovery.kt          → POSSAFE IP keşfi (Faz 2 için altyapı)
    Prefs.kt                 → ayarlar
```
