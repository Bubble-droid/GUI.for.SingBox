#!/bin/sh
# Launch wrapper for gui-for-singbox.
#
# The real binary lives in /usr/lib so the package can ship it together with
# the bundled sing-box cores. The application expects its cores in the user
# data directory, so expose the bundled ones as symlinks there. Existing files
# are left untouched: a core downloaded or replaced by the user always wins.

set -eu

PKG_NAME="gui-for-singbox"
LIB_DIR="/usr/lib/$PKG_NAME"
APP_BIN="$LIB_DIR/$PKG_NAME"
CORES_DIR="$LIB_DIR/cores"

DATA_HOME=""
if [ -n "${XDG_DATA_HOME:-}" ]; then
  case "$XDG_DATA_HOME" in
  /*) DATA_HOME="$XDG_DATA_HOME" ;;
  esac
fi
if [ -z "$DATA_HOME" ] && [ -n "${HOME:-}" ]; then
  DATA_HOME="$HOME/.local/share"
fi

if [ -n "$DATA_HOME" ]; then
  CORE_WORK_DIR="$DATA_HOME/$PKG_NAME/sing-box"
  mkdir -p "$CORE_WORK_DIR" 2>/dev/null || true

  # link_core <bundled core> <path used by the application>
  link_core() {
    if [ -e "$1" ] && [ ! -e "$2" ] && [ ! -L "$2" ]; then
      ln -s "$1" "$2" 2>/dev/null || true
    fi
  }

  # Stable and alpha channels are stored as sing-box and sing-box-latest by
  # the application (see getKernelFileName in frontend/src/utils/helper.ts).
  link_core "$CORES_DIR/sing-box" "$CORE_WORK_DIR/sing-box"
  link_core "$CORES_DIR/sing-box-alpha" "$CORE_WORK_DIR/sing-box-latest"
fi

exec "$APP_BIN" "$@"
