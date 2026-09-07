#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# shellcheck source=./constants.sh
source "./constants.sh"

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

# Platform detection
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

# Linker flags
LDFLAGS_BASE="-X '${GO_MODULE}/config.appVersion=${APP_VERSION}'"
LDFLAGS_LINUX="${LDFLAGS_BASE} -X '${GO_MODULE}/config.singBoxVersion=${STABLE_VER}' -X '${GO_MODULE}/config.singBoxAlphaVersion=${ALPHA_VER}'"

# Execution state guards for shared prerequisites
_FETCH_CORES_DONE=0
_PATCH_MACOS_DONE=0

check_binary() {
  if [[ ! -f "${BIN_DIR}/${APP_ID}" ]]; then
    echo "==> Error: Linux binary '${BIN_DIR}/${APP_ID}' not found. Please run '$(basename "$0") build-linux' first." >&2
    exit 1
  fi
}

fetch_cores() {
  if [[ "$_FETCH_CORES_DONE" -eq 1 ]]; then
    return 0
  fi

  mkdir -p "$CORES_DIR" "$TMP_DIR"
  if [[ -f "${CORES_DIR}/sing-box" && -f "${CORES_DIR}/sing-box-alpha" ]]; then
    echo "==> Cores already downloaded, skipping fetch."
  else
    echo "==> Fetching Sing-Box Cores (Stable: v${STABLE_VER}, Alpha: v${ALPHA_VER}) for ${ARCH}..."
    curl -fsSL -o "${TMP_DIR}/stable.tar.gz" "https://github.com/SagerNet/sing-box/releases/download/v${STABLE_VER}/sing-box-${STABLE_VER}-linux-${ARCH}-glibc.tar.gz"
    tar -xzf "${TMP_DIR}/stable.tar.gz" -C "$TMP_DIR"
    cp "${TMP_DIR}/sing-box-${STABLE_VER}-linux-${ARCH}-glibc/sing-box" "${CORES_DIR}/sing-box"

    curl -fsSL -o "${TMP_DIR}/alpha.tar.gz" "https://github.com/SagerNet/sing-box/releases/download/v${ALPHA_VER}/sing-box-${ALPHA_VER}-linux-${ARCH}-glibc.tar.gz"
    tar -xzf "${TMP_DIR}/alpha.tar.gz" -C "$TMP_DIR"
    cp "${TMP_DIR}/sing-box-${ALPHA_VER}-linux-${ARCH}-glibc/sing-box" "${CORES_DIR}/sing-box-alpha"

    chmod +x "${CORES_DIR}"/*
    rm -rf "${TMP_DIR:?}"/*
  fi
  _FETCH_CORES_DONE=1
}

patch_macos() {
  if [[ "$_PATCH_MACOS_DONE" -eq 1 ]]; then
    return 0
  fi

  echo "==> Patching Wails AppDelegate for macOS Accessory Policy..."
  go mod vendor
  sed -i.bak "s/\[NSApp setActivationPolicy:NSApplicationActivationPolicyRegular\]/[NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory]/g" vendor/github.com/wailsapp/wails/v2/internal/frontend/desktop/darwin/AppDelegate.m
  rm -f vendor/github.com/wailsapp/wails/v2/internal/frontend/desktop/darwin/AppDelegate.m.bak
  _PATCH_MACOS_DONE=1
}

build_frontend() {
  pnpm --dir frontend install --frozen-lockfile
  VITE_APP_VERSION="$APP_VERSION" pnpm --dir frontend build-only
}

build_windows() {
  echo "==> Building Windows binary (${ARCH})..."
  GOOS=windows GOARCH="$ARCH" wails build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_BASE" -o "${APP_ID}.exe"
  (
    cd "$BIN_DIR" &&
      powershell -Command "Compress-Archive -Path '${APP_ID}.exe' -DestinationPath '${APP_ID}-${ARCHIVE_VERSION}-windows-${ARCH}.zip' -Force"
  )
}

build_macos() {
  patch_macos
  echo "==> Building macOS binary (${ARCH})..."
  GOFLAGS="-mod=vendor" GOOS=darwin GOARCH="$ARCH" wails build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_BASE" -o "$APP_ID"
  (
    cd "$BIN_DIR" &&
      mv GUI.for.SingBox.app "${APP_ID}.app" &&
      tar -czvf "${APP_ID}-${ARCHIVE_VERSION}-darwin-${ARCH}.tar.gz" "${APP_ID}.app"
  )
}

build_linux() {
  echo "==> Building Linux binary (${ARCH})..."
  GOOS=linux GOARCH="$ARCH" wails build "${WAILS_FLAGS[@]}" -ldflags "$LDFLAGS_LINUX" -tags webkit2_41 -o "$APP_ID"
  (
    cd "$BIN_DIR" &&
      tar -czvf "${APP_ID}-${ARCHIVE_VERSION}-linux-${ARCH}.tar.gz" "$APP_ID"
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
  local tags="non_xdg"
  [[ -n "$DEV_TAGS" ]] && tags="${DEV_TAGS} non_xdg"

  if [[ "$GOOS" == "darwin" ]]; then
    GOFLAGS="-mod=vendor" VITE_APP_VERSION="$APP_VERSION" wails dev -tags "$tags" -ldflags "$LDFLAGS_BASE"
  else
    VITE_APP_VERSION="$APP_VERSION" wails dev -tags "$tags" -ldflags "$LDFLAGS_BASE"
  fi
}

dev_xdg() {
  if [[ "$DEV_PRE_REQ" == "patch-macos" ]]; then
    patch_macos
  fi
  echo "==> Starting Wails dev mode with XDG..."
  if [[ "$GOOS" == "darwin" ]]; then
    GOFLAGS="-mod=vendor" VITE_APP_VERSION="$APP_VERSION" wails dev -tags "$DEV_TAGS" -ldflags "$LDFLAGS_BASE"
  else
    VITE_APP_VERSION="$APP_VERSION" wails dev -tags "$DEV_TAGS" -ldflags "$LDFLAGS_BASE"
  fi
}

package_deb() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Debian (.deb) for ${DEB_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_VANILLA_DEB" ARCH="$DEB_ARCH" VERSION="$PKG_VERSION" \
    nfpm package -f nfpm.yaml -p deb -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${DEB_ARCH}.deb"
}

package_rpm() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging RPM (.rpm) for ${RPM_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_VANILLA_RPM" ARCH="$RPM_ARCH" VERSION="$PKG_VERSION" \
    nfpm package -f nfpm.yaml -p rpm -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${RPM_ARCH}.rpm"
}

package_pacman() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Pacman (.pkg.tar.zst) for ${RPM_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_VANILLA_ARCH" ARCH="$RPM_ARCH" VERSION="$PKG_VERSION" \
    nfpm package -f nfpm.yaml -p archlinux -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${RPM_ARCH}.pkg.tar.zst"
}

package_deb_full() {
  fetch_cores
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Debian Full (.deb) for ${DEB_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_FULL_DEB" ARCH="$DEB_ARCH" VERSION="$PKG_VERSION" \
    nfpm package -f nfpm-full.yaml -p deb -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${DEB_ARCH}${BUNDLE_SUFFIX}.deb"
}

package_rpm_full() {
  fetch_cores
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging RPM Full (.rpm) for ${RPM_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_FULL_RPM" ARCH="$RPM_ARCH" VERSION="$PKG_VERSION" \
    nfpm package -f nfpm-full.yaml -p rpm -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${RPM_ARCH}${BUNDLE_SUFFIX}.rpm"
}

package_pacman_full() {
  fetch_cores
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Pacman Full (.pkg.tar.zst) for ${RPM_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_FULL_ARCH" ARCH="$RPM_ARCH" VERSION="$PKG_VERSION" \
    nfpm package -f nfpm-full.yaml -p archlinux -t "${PKGS_DIR}/${APP_ID}_${ARCHIVE_VERSION}_linux_${RPM_ARCH}${BUNDLE_SUFFIX}.pkg.tar.zst"
}

package_deb_all() {
  package_deb
  package_deb_full
}
package_rpm_all() {
  package_rpm
  package_rpm_full
}
package_pacman_all() {
  package_pacman
  package_pacman_full
}

package_standard() {
  package_deb
  package_rpm
  package_pacman
}
package_full() {
  package_deb_full
  package_rpm_full
  package_pacman_full
}
package_linux() {
  package_standard
  package_full
}

clean() {
  rm -rf "${BIN_DIR:?}/${APP_ID:?}"* "$CORES_DIR" "$TMP_DIR" "$PKGS_DIR"
}

clean_cores() {
  rm -rf "${CORES_DIR:?}"/*
}

show_help() {
  cat <<EOF
Usage: $(basename "$0") [target...]

Available targets:
  all                  - Build frontend and native binary (default target)
  dev                  - Start Wails dev mode
  dev-xdg              - Start Wails dev mode with XDG enabled
  build-frontend       - Install frontend dependencies and build assets
  build-windows        - Build Windows binary and package zip
  build-macos          - Patch and build macOS application bundle (.app)
  build-linux          - Build Linux binary and package tar.gz
  patch-macos          - Apply accessory activation policy patch to Wails
  fetch-cores          - Download and extract sing-box release cores
  check-binary         - Verify existence of Linux binary before packaging
  package-deb          - Package vanilla Debian package (.deb)
  package-rpm          - Package vanilla RPM package (.rpm)
  package-pacman       - Package vanilla Arch package (.pkg.tar.zst)
  package-deb-full     - Package Debian package with bundled sing-box cores
  package-rpm-full     - Package RPM package with bundled sing-box cores
  package-pacman-full  - Package Arch package with bundled sing-box cores
  package-deb-all      - Package both vanilla and full Debian packages
  package-rpm-all      - Package both vanilla and full RPM packages
  package-pacman-all   - Package both vanilla and full Arch packages
  package-standard     - Package all vanilla Linux formats (.deb, .rpm, .pkg.tar.zst)
  package-full         - Package all full Linux formats
  package-linux        - Run both package-standard and package-full
  clean                - Remove build outputs, downloaded cores, and packages
  clean-cores          - Remove cached core binaries

Environment variable overrides:
  ARCH                 - Override architecture (default: $(go env GOARCH))
  APP_VERSION          - Override version tag (default: git describe or v0.0.0-dev)
  PACKAGER             - Override package maintainer info

Examples:
  ./$(basename "$0")
  ./$(basename "$0") build-linux
  ARCH=arm64 ./$(basename "$0") package-linux
  ./$(basename "$0") clean package-standard
EOF
}

main() {
  if [[ $# -eq 0 ]]; then
    set -- "all"
  fi

  for target in "$@"; do
    case "${target//_/-}" in
    all) all ;;
    dev) dev ;;
    dev-xdg) dev_xdg ;;
    patch-macos) patch_macos ;;
    build-frontend) build_frontend ;;
    build-windows) build_windows ;;
    build-macos) build_macos ;;
    build-linux) build_linux ;;
    fetch-cores) fetch_cores ;;
    check-binary) check_binary ;;
    package-deb) package_deb ;;
    package-rpm) package_rpm ;;
    package-pacman) package_pacman ;;
    package-deb-full) package_deb_full ;;
    package-rpm-full) package_rpm_full ;;
    package-pacman-full) package_pacman_full ;;
    package-deb-all) package_deb_all ;;
    package-rpm-all) package_rpm_all ;;
    package-pacman-all) package_pacman_all ;;
    package-standard) package_standard ;;
    package-full) package_full ;;
    package-linux) package_linux ;;
    clean) clean ;;
    clean-cores) clean_cores ;;
    -h | --help | help)
      show_help
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
