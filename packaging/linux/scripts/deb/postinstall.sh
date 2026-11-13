#!/bin/sh
# Post-install script for gui-for-singbox (deb)

set -eu

PKG_NAME="gui-for-singbox"

if ! getent group "$PKG_NAME" >/dev/null 2>&1; then
  if groupadd -r "$PKG_NAME"; then
    echo "Note: Created system group '$PKG_NAME'."
    echo "Note: To manage TUN interfaces and routing without Polkit password prompts, add your user to the '$PKG_NAME' group."

    cat <<DEPS

Suggested dependencies for '$PKG_NAME':
    libkf6config-bin: Configure KDE system proxy
    libglib2.0-bin: Configure GNOME system proxy
    network-manager: Automatically configure system DNS
DEPS
  else
    echo "Warning: Failed to create group '$PKG_NAME'." >&2
  fi
fi

exit 0
