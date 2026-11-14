#!/bin/sh
# Post-install script for gui-for-singbox (every Linux package format).
#
# The system package installs a root daemon that manages the bundled cores.
# This script only creates the privileged group and wires up the socket unit;
# it never grants file capabilities and never writes sudoers rules.

set -eu

PKG_NAME="gui-for-singbox"
SOCKET_UNIT="${PKG_NAME}-daemon.socket"
SERVICE_UNIT="${PKG_NAME}-daemon.service"
TMPFILES_CONFIG="/usr/lib/tmpfiles.d/${PKG_NAME}.conf"

# gui-for-singbox is a privileged group: its members may ask the root daemon to
# start the sing-box core. Never add users automatically.
if ! getent group "$PKG_NAME" >/dev/null 2>&1; then
  if groupadd -r "$PKG_NAME"; then
    echo "Created system group '$PKG_NAME'."
  else
    echo "Warning: failed to create group '$PKG_NAME'." >&2
  fi
fi

echo "Members of the privileged group '$PKG_NAME' can manage the sing-box core."
echo "Add a trusted user with: sudo usermod -aG $PKG_NAME <user>"
echo "The user must log in again for the group change to take effect."

if [ -f "$TMPFILES_CONFIG" ] && command -v systemd-tmpfiles >/dev/null 2>&1; then
  systemd-tmpfiles --create "$TMPFILES_CONFIG" >/dev/null 2>&1 || true
fi

if [ -d /run/systemd/system ] && command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload || true
  systemctl enable "$SOCKET_UNIT" >/dev/null 2>&1 || true
  if systemctl start "$SOCKET_UNIT"; then
    echo "Enabled $SOCKET_UNIT; the daemon starts on the first GUI request."
  else
    echo "Warning: failed to start $SOCKET_UNIT." >&2
  fi

  # Replacing the daemon binary leaves an already running instance on the old
  # executable. Restart it so the new binary takes effect; the daemon restores
  # a core that was running before. An inactive daemon stays inactive, because
  # socket activation starts it on the next GUI request.
  if systemctl is-active --quiet "$SERVICE_UNIT"; then
    if systemctl try-restart "$SERVICE_UNIT"; then
      echo "Restarted $SERVICE_UNIT to load the new daemon binary."
    else
      echo "Warning: failed to restart $SERVICE_UNIT." >&2
    fi
  fi
else
  echo "Warning: systemd is not available; the core daemon cannot run." >&2
  echo "System package installs require systemd socket activation." >&2
fi

exit 0
