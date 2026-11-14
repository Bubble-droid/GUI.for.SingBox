#!/bin/sh
# Post-remove script for gui-for-singbox.
#
# On package upgrades the daemon keeps running; only real removals stop it.
# State and configuration under /var/lib/gui-for-singbox are always preserved.

set -eu

PKG_NAME="gui-for-singbox"
SOCKET_UNIT="${PKG_NAME}-daemon.socket"
SERVICE_UNIT="${PKG_NAME}-daemon.service"

case "${1:-0}" in
upgrade | failed-upgrade | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)
  # Package manager reports an upgrade, so leave the socket and daemon alone.
  exit 0
  ;;
esac

if [ -d /run/systemd/system ] && command -v systemctl >/dev/null 2>&1; then
  systemctl disable --now "$SERVICE_UNIT" >/dev/null 2>&1 || true
  systemctl disable --now "$SOCKET_UNIT" >/dev/null 2>&1 || true
  systemctl daemon-reload || true
fi

if getent group "$PKG_NAME" >/dev/null 2>&1; then
  echo "System group '$PKG_NAME' was not removed automatically."
fi
echo "Daemon state under /var/lib/$PKG_NAME was preserved."

exit 0
