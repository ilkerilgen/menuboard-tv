#!/usr/bin/env bash
#
# MenuBoard — Ubuntu geliştirme ortamı kurulumu (tek komut)
#
# Kullanım (repo klonlu değilken, en kolay):
#   sudo apt-get update && sudo apt-get install -y curl \
#     && curl -fsSL https://raw.githubusercontent.com/ilkerilgen/menuboard-tv/main/scripts/ubuntu-bootstrap.sh | bash
#
# Veya repo zaten klonluysa:
#   bash scripts/ubuntu-bootstrap.sh
#
# Değişkenlerle özelleştirme (opsiyonel):
#   MENUBOARD_DIR=~/projeler GIT_NAME="Ad Soyad" GIT_EMAIL="a@b.com" bash ubuntu-bootstrap.sh
#
set -euo pipefail

REPO_URL="https://github.com/ilkerilgen/menuboard-tv.git"
WORKDIR="${MENUBOARD_DIR:-$HOME/ClaudeCode}"
GIT_NAME="${GIT_NAME:-ilkerilgen}"
GIT_EMAIL="${GIT_EMAIL:-ilkerilgen@gmail.com}"

log(){ printf "\n\033[1;33m==> %s\033[0m\n" "$*"; }
ok(){  printf "\033[1;32m%s\033[0m\n" "$*"; }

if ! command -v apt-get >/dev/null 2>&1; then
  echo "Bu script Ubuntu/Debian (apt) içindir." >&2
  exit 1
fi

SUDO=""
[ "$(id -u)" -ne 0 ] && SUDO="sudo"

log "Paket listesi güncelleniyor"
$SUDO apt-get update -y

log "Temel araçlar kuruluyor"
$SUDO apt-get install -y \
  git curl wget ca-certificates gnupg jq unzip zip xz-utils file bc rsync xxd \
  build-essential software-properties-common

# ---- GitHub CLI (gh) ----
if ! command -v gh >/dev/null 2>&1; then
  log "GitHub CLI (gh) kuruluyor"
  $SUDO mkdir -p -m 755 /etc/apt/keyrings
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | $SUDO tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
  $SUDO chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | $SUDO tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y gh
else
  log "gh zaten kurulu"
fi

# ---- Node.js 20 LTS (NodeSource) ----
if ! command -v node >/dev/null 2>&1; then
  log "Node.js 20 LTS kuruluyor"
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
else
  log "node zaten kurulu ($(node -v))"
fi

# ---- pi-gen / Raspberry Pi imaj araçları (Faz 3 için) ----
log "pi-gen bağımlılıkları kuruluyor"
$SUDO apt-get install -y \
  quilt parted qemu-user-static debootstrap zerofree dosfstools \
  libarchive-tools libcap2-bin grep pigz arch-test binfmt-support \
  kpartx fdisk || true

# ---- Yerel test araçları: Chromium (Player önizleme) + ffmpeg (video normalize) ----
log "ffmpeg + Chromium kuruluyor (yerel test, opsiyonel)"
$SUDO apt-get install -y ffmpeg || true
$SUDO apt-get install -y chromium-browser || $SUDO apt-get install -y chromium || true

# ---- Git kimliği ----
log "Git kimliği: $GIT_NAME <$GIT_EMAIL>"
git config --global user.name  "$GIT_NAME"
git config --global user.email "$GIT_EMAIL"
git config --global init.defaultBranch main

# ---- Repoyu klonla / güncelle ----
mkdir -p "$WORKDIR"
if [ ! -d "$WORKDIR/menuboard-tv/.git" ]; then
  log "Repo klonlanıyor → $WORKDIR/menuboard-tv"
  git clone "$REPO_URL" "$WORKDIR/menuboard-tv"
else
  log "Repo mevcut, güncelleniyor"
  git -C "$WORKDIR/menuboard-tv" pull --ff-only || true
fi

# ---- Özet ----
log "Kurulum tamam"
ok "✔ Ortam hazır."
echo
echo "Sürümler:"
echo "  git    : $(git --version 2>/dev/null | awk '{print $3}')"
echo "  gh     : $(gh --version 2>/dev/null | head -1 | awk '{print $3}')"
echo "  node   : $(node -v 2>/dev/null || echo yok)"
echo "  ffmpeg : $(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}' || echo yok)"
echo
echo "Sıradaki adımlar:"
echo "  1) GitHub girişi :  gh auth login"
echo "  2) Proje klasörü :  cd $WORKDIR/menuboard-tv"
echo "  3) Claude Code'u başlat ve de ki:"
echo "     \"docs/PLATFORM-PLAN.md'yi oku, MenuBoard projesine devam ediyoruz\""
echo
echo "Not: Claude Code kurulu değilse →  sudo npm install -g @anthropic-ai/claude-code"
