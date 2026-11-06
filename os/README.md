# MenuBoard OS — Raspberry Pi kiosk (tak-çalış)

Raspberry Pi'yi, açılır açılmaz **tam ekran** `https://menubord.com.tr/` gösteren, **ekranı hiç kapanmayan**,
çökünce kendini toparlayan bir **menü-panosu cihazı**na çevirir. Donanım: **Pi 4 / Pi 5** (bkz. `docs/PLATFORM-PLAN.md`).

> Player bir **bulut URL'si** olduğu için içerik ve uygulama **kendini günceller** (OTA) — cihaza dokunmaya gerek yok.

## 1) SD kartı yaz (klavyesiz kurulum için)
**Raspberry Pi Imager** ile **Raspberry Pi OS Lite (64-bit)** seç. ⚙️ (gear) ile **önceden ayarla**:
- Hostname (ör. `menuboard-1`), **SSH aç** (şifre veya anahtar)
- **WiFi** (SSID + şifre) + ülke, saat dilimi, klavye

Böylece Pi ilk açılışta ağa bağlanır; klavye/mouse gerekmez — sadece SSH.

## 2) Tek komutla kiosk yap
Pi açıldıktan sonra SSH ile bağlan ve çalıştır:
```bash
curl -fsSL https://raw.githubusercontent.com/ilkerilgen/menuboard-tv/main/os/install.sh | sudo bash
```

**Dikey ekran** (portre montaj) için:
```bash
sudo MENUBOARD_ROTATE=left bash -c "$(curl -fsSL https://raw.githubusercontent.com/ilkerilgen/menuboard-tv/main/os/install.sh)"
```
`MENUBOARD_ROTATE` = `normal` | `left` | `right` | `inverted`.
Farklı adres için: `MENUBOARD_URL=https://app.menubord.com.tr/`.

Kurulum biter, Pi **yeniden başlar** ve doğrudan kiosk'a açılır.

## 3) Eşle
Ekranda **6 haneli eşleme kodu** çıkar → `https://menubord.com.tr/admin` panelinden kodu + işletme adı + yön gir → birkaç saniyede menü gelir. Dükkândaki POS için `connector`'ı çalıştır (bkz. `connector/README.md`).

## Ne yapar (özet)
- 🖥️ Chromium **--kiosk** tam ekran, imleç gizli, autologin + `startx`
- 🔆 **Ekran kapanmaz** (`xset -dpms/s off/noblank` + `consoleblank=0`)
- ♻️ Chromium çökerse **otomatik yeniden başlar** (session.sh while-loop)
- 🔄 İçerik/uygulama **buluttan OTA** (URL), yerel profil kalıcı (offline cache + cihaz id)
- ↕️ Dikey/yatay (`xrandr --rotate`)

## Sorun giderme
- SSH ile geri bağlan: `ssh pi@<hostname>.local`
- Yeniden kur / URL değiştir: install.sh'i tekrar çalıştır.
- Kiosk loglarını gör: `cat ~/.local/share/xorg/Xorg.0.log` veya `journalctl -b`.
- Chromium profilini sıfırla: `rm -rf ~/.config/menuboard-chromium && sudo reboot`.

## Yol haritası
- Bu `install.sh`, ileride **pi-gen + GitHub Actions** ile hazır **`.img`** içine gömülecek
  (SD'ye yaz-tak-çalış, SSH bile gerekmeden). Zero-touch eşleme (hotspot onboarding), overlayfs
  (elektrik kesintisine dayanım) ve watchdog bir sonraki adımlar — bkz. `docs/PLATFORM-PLAN.md` §7.
