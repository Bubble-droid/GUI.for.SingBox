#!/usr/bin/env bash
set -euo pipefail

# === env & metadata ===
ROOT_DIR="$(git rev-parse --show-toplevel)"
GIT_REPO="Bubble-droid/GUI.for.SingBox"
TOOL_DIR="$ROOT_DIR/.bin"
WALIS_BIN="$TOOL_DIR/wails"
NFPM_BIN="$TOOL_DIR/nfpm"

cd "$ROOT_DIR"

# Application metadata
APP_ID="gui-for-singbox"
GO_MODULE="guiforcores"

export VITE_APP_ID="$APP_ID"
export VITE_APP_PROJECT_URL="https://github.com/$GIT_REPO"
export VITE_APP_VERSION_API="https://api.github.com/repos/$GIT_REPO/releases/latest"

# Paths
BIN_DIR="build/bin"
PKGS_DIR="dist"

# Build flags
WAILS_FLAGS=(-m -s -trimpath -skipbindings -devtools)

# Package descriptions
DESC="A GUI client application for sing-box"

DEB_SUGGESTS="

Suggested Dependencies:
  * pkexec: Interactive authorization for privileged operations
  * libcap2-bin: Grant network capabilities to core binaries
  * libkf6config-bin: Configure KDE system proxy
  * libglib2.0-bin: Configure GNOME system proxy
  * network-manager: Automatically configure system DNS"

RPM_SUGGESTS="

Suggested Dependencies:
  * polkit: Interactive authorization for privileged operations
  * libcap: Grant network capabilities to core binaries
  * kf6-kconfig: Configure KDE system proxy
  * glib2: Configure GNOME system proxy
  * NetworkManager: Automatically configure system DNS"

DESC_DEB="${DESC}${DEB_SUGGESTS}"
DESC_RPM="${DESC}${RPM_SUGGESTS}"
DESC_ARCH="${DESC}"

# Environment variables resolution
GOOS="${GOOS:-$(go env GOOS)}"
ARCH="${ARCH:-$(go env GOARCH)}"
APP_VERSION="${APP_VERSION:-$(git describe --tags --always 2>/dev/null || echo "v0.0.0-dev")}"

GIT_USER="$(git config user.name 2>/dev/null || true)"
GIT_EMAIL="$(git config user.email 2>/dev/null || true)"
if [[ -n "$GIT_USER" ]]; then
  DEFAULT_PACKAGER="${GIT_USER} <${GIT_EMAIL}>"
else
  DEFAULT_PACKAGER="Unknown Packager <user@example.com>"
fi
PACKAGER="${PACKAGER:-$DEFAULT_PACKAGER}"

# === platform detection ===
case "$GOOS" in
windows)
  NATIVE_BUILD_TARGET="build-windows"
  DEV_TAGS=""
  DEV_PRE_REQ=""
  ;;
darwin)
  NATIVE_BUILD_TARGET="build-macos"
  DEV_TAGS=""
  DEV_PRE_REQ="patch-macos"
  ;;
*)
  NATIVE_BUILD_TARGET="build-linux"
  DEV_TAGS="webkit2_41"
  DEV_PRE_REQ=""
  ;;
esac

# Version string conversions
ARCHIVE_VERSION="${APP_VERSION#v}"
PKG_VERSION="${ARCHIVE_VERSION//-/\~}"

# Target architectures
DEB_ARCH="$ARCH"
case "$ARCH" in
amd64) RPM_ARCH="x86_64" ;;
arm64) RPM_ARCH="aarch64" ;;
*) RPM_ARCH="$ARCH" ;;
esac

# === buildinfo ldflags ===
GIT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
  GIT_TREE_STATE="clean"
else
  GIT_TREE_STATE="dirty"
fi
BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
BUILT_BY="${PACKAGER:-unknown}"

# Linker flags (array keeps values with spaces intact)
LDFLAGS=(
  "-X '${GO_MODULE}/internal/buildinfo.GitVersion=${APP_VERSION}'"
  "-X '${GO_MODULE}/internal/buildinfo.GitCommit=${GIT_COMMIT}'"
  "-X '${GO_MODULE}/internal/buildinfo.GitTreeState=${GIT_TREE_STATE}'"
  "-X '${GO_MODULE}/internal/buildinfo.BuildDate=${BUILD_DATE}'"
  "-X '${GO_MODULE}/internal/buildinfo.BuiltBy=${BUILT_BY}'"
)
LDFLAGS_BASE="${LDFLAGS[*]}"

# === prerequisites & init ===
_PATCH_MACOS_DONE=0

install_tools() {
  if [ $# -eq 0 ]; then
    echo "==> Installing tools..."
    bash "$ROOT_DIR/scripts/install-tools.sh"
  else
    bash "$ROOT_DIR/scripts/install-tools.sh" "$@"
  fi
}

init_hooks() {
  echo "==> Installing git hooks..."
  if [[ -x "$TOOL_DIR/lefthook" ]]; then
    "$TOOL_DIR/lefthook" install
  elif command -v lefthook >/dev/null 2>&1; then
    lefthook install
  else
    echo "==> Warning: lefthook not found, skipping hook install" >&2
  fi
}

init() {
  install_tools
  init_hooks
}

# === packaging (nFPM) ===
check_binary() {
  if [[ ! -f "${BIN_DIR}/${APP_ID}" ]]; then
    echo "==> Error: Linux binary '${BIN_DIR}/${APP_ID}' not found. Please run '$(basename "$0") build-linux' first." >&2
    exit 1
  fi
}

cleanup_macos_patch() {
  if [[ "$_PATCH_MACOS_DONE" -eq 1 ]]; then
    rm -rf "$ROOT_DIR/vendor"
    _PATCH_MACOS_DONE=0
  fi
}

patch_macos() {
  if [[ "$_PATCH_MACOS_DONE" -eq 1 ]]; then
    return 0
  fi

  echo "==> Patching Wails AppDelegate for macOS Accessory Policy..."
  go mod vendor

  local target="vendor/github.com/wailsapp/wails/v2/internal/frontend/desktop/darwin/AppDelegate.m"
  if [[ ! -f "$target" ]]; then
    echo "==> Error: $target not found; cannot apply macOS patch" >&2
    return 1
  fi

  if grep -q "NSApplicationActivationPolicyAccessory" "$target"; then
    echo "==> macOS patch already applied"
  elif grep -q "NSApplicationActivationPolicyRegular" "$target"; then
    sed -i.bak "s/\[NSApp setActivationPolicy:NSApplicationActivationPolicyRegular\]/[NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory]/g" "$target"
    rm -f "$target.bak"
  else
    echo "==> Error: patch anchor not found in $target" >&2
    return 1
  fi

  _PATCH_MACOS_DONE=1
}

# === build: frontend/native ===
build_frontend() {
  pnpm --dir frontend install --frozen-lockfile
  VITE_APP_VERSION="$APP_VERSION" pnpm --dir frontend build-only
}

build_windows() {
  echo "==> Building Windows binary (${ARCH})..."
  GOOS=windows GOARCH="$ARCH" "$WALIS_BIN" build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_BASE" -o "${APP_ID}.exe"
  (
    cd "$BIN_DIR" &&
      powershell -Command "Compress-Archive -Path '${APP_ID}.exe' -DestinationPath '${APP_ID}_${ARCHIVE_VERSION}_windows_${ARCH}.zip' -Force"
  )
}

build_macos() {
  patch_macos
  echo "==> Building macOS binary (${ARCH})..."
  GOFLAGS="-mod=vendor" GOOS=darwin GOARCH="$ARCH" "$WALIS_BIN" build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_BASE" -o "$APP_ID"
  (
    cd "$BIN_DIR" &&
      # wails names the bundle after the output filename; tolerate either name
      if [[ -d "GUI.for.SingBox.app" && ! -d "${APP_ID}.app" ]]; then
        mv "GUI.for.SingBox.app" "${APP_ID}.app"
      fi &&
      tar -czvf "${APP_ID}_${ARCHIVE_VERSION}_darwin_${ARCH}.tar.gz" "${APP_ID}.app"
  )
  cleanup_macos_patch
}

build_linux() {
  echo "==> Building Linux binary (${ARCH})..."
  GOOS=linux GOARCH="$ARCH" "$WALIS_BIN" build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_BASE" -tags webkit2_41 -o "$APP_ID"
  (
    cd "$BIN_DIR" &&
      tar -czvf "${APP_ID}_${ARCHIVE_VERSION}_linux_${ARCH}.tar.gz" "$APP_ID"
  )
}

all() {
  build_frontend
  case "$NATIVE_BUILD_TARGET" in
  build-windows) build_windows ;;
  build-macos) build_macos ;;
  build-linux) build_linux ;;
  esac
}

dev() {
  if [[ "$DEV_PRE_REQ" == "patch-macos" ]]; then
    patch_macos
  fi
  echo "==> Starting Wails dev mode..."
  local tags="dev non_xdg"
  [[ -n "$DEV_TAGS" ]] && tags="dev ${DEV_TAGS} non_xdg"

  if [[ "$GOOS" == "darwin" ]]; then
    GOFLAGS="-mod=vendor" VITE_APP_VERSION="$APP_VERSION" "$WALIS_BIN" dev -tags "$tags" -ldflags "$LDFLAGS_BASE"
    cleanup_macos_patch
  else
    VITE_APP_VERSION="$APP_VERSION" "$WALIS_BIN" dev -tags "$tags" -ldflags "$LDFLAGS_BASE"
  fi
}

dev_xdg() {
  if [[ "$DEV_PRE_REQ" == "patch-macos" ]]; then
    patch_macos
  fi
  echo "==> Starting Wails dev mode with XDG..."
  local tags="dev"
  [[ -n "$DEV_TAGS" ]] && tags="dev ${DEV_TAGS}"

  if [[ "$GOOS" == "darwin" ]]; then
    GOFLAGS="-mod=vendor" VITE_APP_VERSION="$APP_VERSION" "$WALIS_BIN" dev -tags "$tags" -ldflags "$LDFLAGS_BASE"
    cleanup_macos_patch
  else
    VITE_APP_VERSION="$APP_VERSION" "$WALIS_BIN" dev -tags "$tags" -ldflags "$LDFLAGS_BASE"
  fi
}

package_deb() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Debian (.deb) for ${DEB_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_DEB" ARCH="$DEB_ARCH" VERSION="$PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p deb -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${DEB_ARCH}.deb"
}

package_rpm() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging RPM (.rpm) for ${RPM_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_RPM" ARCH="$RPM_ARCH" VERSION="$PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p rpm -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${RPM_ARCH}.rpm"
}

package_pacman() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Pacman (.pkg.tar.zst) for ${RPM_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_ARCH" ARCH="$RPM_ARCH" VERSION="$PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p archlinux -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${RPM_ARCH}.pkg.tar.zst"
}

package_linux() {
  package_deb
  package_rpm
  package_pacman
}

clean_bin() {
  rm -rf "${BIN_DIR:?}/${APP_ID:?}"*
}

clean_pkgs() {
  rm -rf "${PKGS_DIR:?}/${APP_ID:?}"*
}

clean() {
  clean_bin
  clean_pkgs
}

# === utils/clean/help/main ===
show_help() {
  local execName=""

  if [[ "$*" == "make" ]]; then
    execName="$*"
  else
    execName="bash $(basename "$0")"
  fi

  cat <<EOF
Usage: $execName [target...]

Available targets:
  init                 - Install tools and setup git hooks
  install-tools [list] - Install specified tools (lefthook/wails/nfpm) or all if none
  all                  - Build frontend and native binary (default target)
  dev                  - Start Wails dev mode
  dev-xdg              - Start Wails dev mode with XDG enabled
  build-frontend       - Install frontend dependencies and build assets
  build-windows        - Build Windows binary and package zip
  build-macos          - Patch and build macOS application bundle (.app)
  build-linux          - Build Linux binary and package tar.gz
  package-deb          - Package Debian package (.deb)
  package-rpm          - Package RPM package (.rpm)
  package-pacman       - Package Arch package (.pkg.tar.zst)
  package-linux        - Run all package
  clean                - Remove build outputs and packages

Environment variable overrides:
  ARCH                 - Override architecture (default: $(go env GOARCH))
  APP_VERSION          - Override version tag (default: git describe or v0.0.0-dev)
  PACKAGER             - Override package maintainer info

Examples:
  $execName init
  $execName build-linux package-linux
EOF
}

main() {
  if [[ $# -eq 0 ]]; then
    set -- "all"
  fi

  for target in "$@"; do
    case "${target//_/-}" in
    init) init ;;
    install-tools)
      install_tools "${@:2}"
      exit 0
      ;;
    all) all ;;
    dev) dev ;;
    dev-xdg) dev_xdg ;;
    build-frontend) build_frontend ;;
    build-windows) build_windows ;;
    build-macos) build_macos ;;
    build-linux) build_linux ;;
    package-deb) package_deb ;;
    package-rpm) package_rpm ;;
    package-pacman) package_pacman ;;
    package-linux) package_linux ;;
    clean) clean ;;
    -h | --help | help)
      shift
      show_help "$@"
      exit 0
      ;;
    *)
      echo "==> Error: Unknown target '${target}'" >&2
      echo "" >&2
      show_help >&2
      exit 1
      ;;
    esac
  done
}

main "$@"
