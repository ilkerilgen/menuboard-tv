#!/usr/bin/env bash
#
# MenuBoard OS — Raspberry Pi kiosk provisioning (tak-çalış appliance)
#
# Taze Raspberry Pi OS **Lite (64-bit)** üzerinde TEK komutla çalıştırın:
#   curl -fsSL https://raw.githubusercontent.com/ilkerilgen/menuboard-tv/main/os/install.sh | sudo bash
#
# Seçenekli (dikey ekran / farklı URL):
#   sudo MENUBOARD_ROTATE=left bash -c "$(curl -fsSL https://raw.githubusercontent.com/ilkerilgen/menuboard-tv/main/os/install.sh)"
#
# Ne yapar:
#   - Chromium'u TAM EKRAN kiosk olarak açar: https://menubord.com.tr/
#   - Ekran asla kapanmaz (DPMS/screensaver kapalı)
#   - Chromium çökerse kendini yeniden başlatır (auto-recovery)
#   - İmleci gizler, açılışta otomatik gelir (konsol autologin + startx)
#   - Dikey montaj için ekranı döndürebilir (MENUBOARD_ROTATE)
#   - Player bir bulut URL'si olduğundan içerik/uygulama kendini günceller (OTA)
#
set -euo pipefail

URL="${MENUBOARD_URL:-https://menubord.com.tr/}"
ROTATE="${MENUBOARD_ROTATE:-normal}"     # normal | left | right | inverted
KIOSK_USER="${SUDO_USER:-pi}"
HOME_DIR="$(getent passwd "$KIOSK_USER" | cut -d: -f6)"

if [ "$(id -u)" -ne 0 ]; then echo "sudo ile çalıştırın."; exit 1; fi
echo "==> MenuBoard OS kurulumu — kullanıcı=$KIOSK_USER url=$URL rotate=$ROTATE"

echo "==> Paketler kuruluyor"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  xserver-xorg x11-xserver-utils xinit openbox unclutter ca-certificates \
  || true
# Chromium paket adı dağıtıma göre değişir
apt-get install -y --no-install-recommends chromium-browser \
  || apt-get install -y --no-install-recommends chromium \
  || true
CHROME="$(command -v chromium-browser || command -v chromium || echo /usr/bin/chromium)"
echo "==> Chromium: $CHROME"

echo "==> Kiosk oturum betiği yazılıyor (/opt/menuboard/session.sh)"
install -d -m 755 /opt/menuboard
cat > /opt/menuboard/session.sh <<EOF
#!/usr/bin/env bash
# MenuBoard kiosk X oturumu (otomatik üretildi)
export DISPLAY=:0

# Ekranı asla kapatma
xset -dpms || true
xset s off || true
xset s noblank || true

# Dikey montaj için döndürme
if [ "$ROTATE" != "normal" ]; then
  OUT=\$(xrandr 2>/dev/null | awk '/ connected/{print \$1; exit}')
  [ -n "\$OUT" ] && xrandr --output "\$OUT" --rotate "$ROTATE" || true
fi

# İmleci gizle
unclutter -idle 0 -root &
# Pencere yöneticisi (Chromium'un tam ekran oturması için)
openbox-session &

# Chromium kiosk — çökerse yeniden başlat (auto-recovery)
PROFILE="$HOME_DIR/.config/menuboard-chromium"
while true; do
  "$CHROME" \\
    --kiosk --start-fullscreen --noerrdialogs --disable-infobars --disable-translate \\
    --no-first-run --no-default-browser-check --disable-session-crashed-bubble \\
    --disable-component-update --check-for-update-interval=31536000 \\
    --password-store=basic --autoplay-policy=no-user-gesture-required \\
    --use-gl=egl --enable-gpu-rasterization --ignore-gpu-blocklist \\
    --overscroll-history-navigation=0 --disable-pinch \\
    --user-data-dir="\$PROFILE" \\
    "$URL"
  sleep 3
done
EOF
chmod +x /opt/menuboard/session.sh

echo "==> .xinitrc ve autologin ayarlanıyor"
cat > "$HOME_DIR/.xinitrc" <<EOF
#!/usr/bin/env bash
exec /opt/menuboard/session.sh
EOF
chown "$KIOSK_USER:$KIOSK_USER" "$HOME_DIR/.xinitrc"

# Konsol autologin (tty1) — raspi-config varsa onu kullan
if command -v raspi-config >/dev/null 2>&1; then
  raspi-config nonint do_boot_behaviour B2 || true
fi

# tty1'de otomatik startx
PROFILE_FILE="$HOME_DIR/.bash_profile"
touch "$PROFILE_FILE"
if ! grep -q "menuboard-startx" "$PROFILE_FILE"; then
  cat >> "$PROFILE_FILE" <<'EOF'

# menuboard-startx: tty1'de grafik oturumu otomatik başlat
if [ -z "${DISPLAY:-}" ] && [ "$(tty)" = "/dev/tty1" ]; then
  exec startx
fi
EOF
fi
chown "$KIOSK_USER:$KIOSK_USER" "$PROFILE_FILE"

# Boot sırasında konsol ekran boşluğunu kapat
for CMDLINE in /boot/firmware/cmdline.txt /boot/cmdline.txt; do
  if [ -f "$CMDLINE" ] && ! grep -q "consoleblank=0" "$CMDLINE"; then
    sed -i 's/$/ consoleblank=0/' "$CMDLINE" || true
    break
  fi
done

echo "==> Kurulum tamamlandı. 5 sn içinde yeniden başlatılıyor..."
echo "    Açılınca ekranda eşleme kodu çıkacak → $URL panelinden (/admin) eşleyin."
sleep 5
reboot
