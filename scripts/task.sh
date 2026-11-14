#!/usr/bin/env bash
set -euo pipefail

# === env & metadata ===
ROOT_DIR="$(git rev-parse --show-toplevel)"
TOOL_DIR="$ROOT_DIR/.bin"
WALIS_BIN="$TOOL_DIR/wails"
NFPM_BIN="$TOOL_DIR/nfpm"

cd "$ROOT_DIR"

# Application metadata
GO_MODULE="github.com/Bubble-droid/GUI.for.SingBox"
APP_NAME="GUI.for.SingBox"
PKG_NAME="gui-for-singbox"

# Paths
BIN_DIR="build/bin"
PKGS_DIR="dist"
CORES_DIR="${PKGS_DIR}/cores"
CORES_CACHE_DIR="${CORES_DIR}/.cache"
CORE_MANIFEST="packaging/linux/cores/cores.txt"

# Package descriptions
DESC="A GUI client for sing-box"

DEB_SUGGESTS="

Suggested Dependencies:
  * libkf6config-bin: Configure KDE system proxy
  * libglib2.0-bin: Configure GNOME system proxy
  * network-manager: Automatically configure system DNS"

RPM_SUGGESTS="

Suggested Dependencies:
  * kf6-kconfig: Configure KDE system proxy
  * glib2: Configure GNOME system proxy
  * NetworkManager: Automatically configure system DNS"

DESC_DEB="${DESC}${DEB_SUGGESTS}"
DESC_RPM="${DESC}${RPM_SUGGESTS}"

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
ARCH_PKG_VERSION="${ARCHIVE_VERSION//-/}"

# Target architectures
DEB_ARCH="$ARCH"
case "$ARCH" in
amd64) SYS_ARCH="x86_64" ;;
arm64) SYS_ARCH="aarch64" ;;
*) SYS_ARCH="$ARCH" ;;
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

# Build flags
WAILS_FLAGS=(-m -s -trimpath -skipbindings -devtools)

# Linker flags (array keeps values with spaces intact)
LDFLAGS=(
  "-X '${GO_MODULE}/bridge.GitVersion=${APP_VERSION}'"
  "-X '${GO_MODULE}/bridge.GitCommit=${GIT_COMMIT}'"
  "-X '${GO_MODULE}/bridge.GitTreeState=${GIT_TREE_STATE}'"
  "-X '${GO_MODULE}/bridge.BuildDate=${BUILD_DATE}'"
  "-X '${GO_MODULE}/bridge.BuiltBy=${BUILT_BY}'"
)
LDFLAGS_BASE="${LDFLAGS[*]}"

# Dedicated Linux package binary: inject the system package flag so package
# installs always use the per-user directories. Builds without the flag keep
# the path-based detection as a fallback.
PACKAGE_LDFLAGS=(
  "-X '${GO_MODULE}/bridge.SystemPackage=true'"
)
LDFLAGS_PACKAGE="${LDFLAGS_BASE} ${PACKAGE_LDFLAGS[*]}"

# Records that build/bin/gui-for-singbox was produced by
# build-linux-package, so packaging steps can reuse it across make runs.
LINUX_PACKAGE_MARKER="${BIN_DIR}/.linux-package"

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
# ensure_package_binary guarantees the binary the packages ship was built with
# the system package flag. A portable build (or a fresh checkout) triggers the
# dedicated package build instead of being packaged silently.
ensure_package_binary() {
  if [[ -f "${BIN_DIR}/${PKG_NAME}" && -f "$LINUX_PACKAGE_MARKER" ]]; then
    return 0
  fi
  build_linux_package
}

# === bundled sing-box cores ===
_CORES_PREPARED=0

core_version() {
  local channel="$1"
  local version

  if [[ ! -f "$CORE_MANIFEST" ]]; then
    echo "==> Error: Core manifest '${CORE_MANIFEST}' not found." >&2
    return 1
  fi

  version="$(awk -v channel="$channel" 'NF == 2 && $1 == channel { print $2; found = 1; exit } END { exit !found }' "$CORE_MANIFEST")" || {
    echo "==> Error: No version for channel '${channel}' in '${CORE_MANIFEST}'." >&2
    return 1
  }

  printf '%s\n' "$version"
}

core_release_arch() {
  case "$ARCH" in
  arm) echo "armv7" ;;
  *) echo "$ARCH" ;;
  esac
}

core_asset_name() {
  local version="$1"
  echo "sing-box-${version}-linux-$(core_release_arch)-glibc.tar.gz"
}

core_sha256() {
  local channel="$1"
  local release_arch
  release_arch="$(core_release_arch)"

  awk -v channel="$channel" -v arch="$release_arch" \
    'NF == 3 && $1 == channel && $2 == arch { print $3; found = 1; exit } END { exit !found }' \
    "$CORE_MANIFEST"
}

download_core_asset() {
  local url="$1"
  local dest="$2"
  local expected="$3"
  local attempt tmp actual

  tmp="${dest}.part"

  if [[ -f "$dest" ]]; then
    if echo "${expected}  ${dest}" | sha256sum -c --status -; then
      echo "==> Using cached $(basename "$dest")"
      return 0
    fi
    echo "==> Cached $(basename "$dest") checksum mismatch, downloading again..." >&2
    rm -f "$dest"
  fi

  for attempt in 1 2 3; do
    echo "==> Downloading $(basename "$dest") (attempt ${attempt}/3)..."
    rm -f "$tmp"

    if curl -fL --connect-timeout 20 --silent --show-error -o "$tmp" "$url"; then
      actual="$(sha256sum "$tmp" | awk '{ print $1 }')"
      if [[ "$actual" == "$expected" ]]; then
        mv -f "$tmp" "$dest"
        return 0
      fi
      echo "==> Error: SHA-256 mismatch for $(basename "$dest")" >&2
    else
      echo "==> Error: Failed to download $(basename "$dest")" >&2
    fi

    rm -f "$tmp"
    if [[ "$attempt" -lt 3 ]]; then
      sleep 2
    fi
  done

  echo "==> Error: $(basename "$dest") could not be downloaded after 3 attempts." >&2
  return 1
}

prepare_core() {
  local channel="$1"
  local output_name="$2"
  local version asset expected url tarball tmp_dir member license_member asset_dir

  version="$(core_version "$channel")"
  asset="$(core_asset_name "$version")"
  if ! expected="$(core_sha256 "$channel")"; then
    expected=""
  fi
  asset_dir="${asset%.tar.gz}"

  if [[ -z "$expected" ]]; then
    echo "==> Error: No SHA-256 checksum for '${channel}' on '$(core_release_arch)' in '${CORE_MANIFEST}'." >&2
    return 1
  fi

  url="https://github.com/SagerNet/sing-box/releases/download/v${version}/${asset}"
  tarball="${CORES_CACHE_DIR}/${asset}"
  member="${asset_dir}/sing-box"
  license_member="${asset_dir}/LICENSE"

  mkdir -p "$CORES_CACHE_DIR" "$CORES_DIR"
  download_core_asset "$url" "$tarball" "$expected"

  tmp_dir="$(mktemp -d "${CORES_CACHE_DIR}/extract.XXXXXX")"
  if ! tar -xzf "$tarball" -C "$tmp_dir" "$member" "$license_member"; then
    rm -rf "$tmp_dir"
    echo "==> Error: Failed to extract '${member}' and '${license_member}' from $(basename "$tarball")." >&2
    return 1
  fi

  install -m 0755 "${tmp_dir}/${member}" "${CORES_DIR}/${output_name}"
  install -m 0644 "${tmp_dir}/${license_member}" "${CORES_DIR}/${output_name}.LICENSE"
  rm -rf "$tmp_dir"

  echo "==> Bundled sing-box ${channel} ${version} as ${CORES_DIR}/${output_name}"
}

prepare_cores() {
  if [[ "$_CORES_PREPARED" -eq 1 ]]; then
    return 0
  fi

  echo "==> Preparing bundled sing-box cores (${ARCH})..."
  prepare_core stable sing-box
  prepare_core alpha sing-box-alpha
  _CORES_PREPARED=1
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
  GOOS=windows GOARCH="$ARCH" "$WALIS_BIN" build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_BASE" -o "${APP_NAME}.exe"
  (
    cd "$BIN_DIR" &&
      powershell -Command "Compress-Archive -Path '${APP_NAME}.exe' -DestinationPath '${APP_NAME}-${ARCHIVE_VERSION}-windows-${ARCH}.zip' -Force"
  )
}

build_macos() {
  patch_macos
  echo "==> Building macOS binary (${ARCH})..."
  GOFLAGS="-mod=vendor" GOOS=darwin GOARCH="$ARCH" "$WALIS_BIN" build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_BASE" -o "$APP_NAME"
  (
    cd "$BIN_DIR" &&
      tar -czvf "${APP_NAME}-${ARCHIVE_VERSION}-darwin-${ARCH}.tar.gz" "${APP_NAME}.app"
  )
  cleanup_macos_patch
}

build_linux() {
  echo "==> Building Linux binary (${ARCH})..."
  GOOS=linux GOARCH="$ARCH" "$WALIS_BIN" build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_BASE" -tags webkit2_41 -o "$PKG_NAME"
  rm -f "$LINUX_PACKAGE_MARKER"
  (
    cd "$BIN_DIR" &&
      tar -czvf "${APP_NAME}-${ARCHIVE_VERSION}-linux-${ARCH}.tar.gz" "$PKG_NAME"
  )
}

build_linux_package() {
  echo "==> Building dedicated Linux package binary (${ARCH})..."
  GOOS=linux GOARCH="$ARCH" "$WALIS_BIN" build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_PACKAGE" -tags webkit2_41 -o "$PKG_NAME"
  touch "$LINUX_PACKAGE_MARKER"
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
  ensure_package_binary
  prepare_cores
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Debian (.deb) for ${DEB_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_DEB" ARCH="$DEB_ARCH" VERSION="$PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p deb -t "${PKGS_DIR}/${PKG_NAME}_${ARCHIVE_VERSION}_linux_${DEB_ARCH}.deb"
}

package_rpm() {
  ensure_package_binary
  prepare_cores
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging RPM (.rpm) for ${SYS_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_RPM" ARCH="$SYS_ARCH" VERSION="$PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p rpm -t "${PKGS_DIR}/${PKG_NAME}_${ARCHIVE_VERSION}_linux_${SYS_ARCH}.rpm"
}

package_pacman() {
  ensure_package_binary
  prepare_cores
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Pacman (.pkg.tar.zst) for ${SYS_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC" ARCH="$SYS_ARCH" VERSION="$ARCH_PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p archlinux -t "${PKGS_DIR}/${PKG_NAME}_${ARCHIVE_VERSION}_linux_${SYS_ARCH}.pkg.tar.zst"
}

package_linux() {
  package_deb
  package_rpm
  package_pacman
}

clean_bin() {
  rm -rf "${BIN_DIR:?}/${APP_NAME:?}"* "${BIN_DIR:?}/${PKG_NAME:?}"* "$LINUX_PACKAGE_MARKER"
}

clean_pkgs() {
  rm -rf "${PKGS_DIR:?}/${PKG_NAME:?}"* "$CORES_DIR"
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
  build-frontend       - Install frontend dependencies and build assets
  build-windows        - Build Windows binary and package zip
  build-macos          - Patch and build macOS application bundle (.app)
  build-linux          - Build portable Linux binary and package tar.gz
  build-linux-package  - Build dedicated Linux binary for system packages
  package-deb          - Package Debian package (.deb)
  package-rpm          - Package RPM package (.rpm)
  package-pacman       - Package Arch package (.pkg.tar.zst)
  package-linux        - Run all package
  clean                - Remove build outputs, packages, and bundled core cache

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
    build-frontend) build_frontend ;;
    build-windows) build_windows ;;
    build-macos) build_macos ;;
    build-linux) build_linux ;;
    build-linux-package) build_linux_package ;;
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
