#!/bin/sh
# GUI.for.SingBox - Standard post-installation script

echo "==> Running post-installation tasks for GUI.for.SingBox..."

if ! getent group gui-for-singbox >/dev/null; then
  echo "==> Creating system group 'gui-for-singbox'..."
  groupadd -r gui-for-singbox || echo "  -> Warning: Failed to create group."
fi

CAPS="cap_net_admin,cap_net_raw,cap_net_bind_service=ep"
CORE_DIR="/usr/lib/gui-for-singbox/cores"

echo "==> Setting capabilities for sing-box cores..."

if command -v setcap >/dev/null 2>&1; then
  if [ -f "$CORE_DIR/sing-box" ]; then
    if setcap "$CAPS" "$CORE_DIR/sing-box"; then
      echo "  -> Stable core capabilities set successfully."
    else
      echo "  -> Warning: Failed to set capabilities for Stable core."
    fi
  fi

  if [ -f "$CORE_DIR/sing-box-alpha" ]; then
    if setcap "$CAPS" "$CORE_DIR/sing-box-alpha"; then
      echo "  -> Alpha core capabilities set successfully."
    else
      echo "  -> Warning: Failed to set capabilities for Alpha core."
    fi
  fi
else
  echo "  -> Warning: 'setcap' command not found. Cannot set network capabilities automatically."
  echo "     Please install 'libcap' (or 'libcap2-bin' on Debian/Ubuntu) and run manually:"
  echo "     sudo setcap \"$CAPS\" \"$CORE_DIR/sing-box\""
  echo "     sudo setcap \"$CAPS\" \"$CORE_DIR/sing-box-alpha\""
fi

cat <<'EOF'

=========================================================================
  ==> IMPORTANT:
      To allow GUI.for.SingBox to manage TUN and routing without password,
      you MUST add your current user to the 'gui-for-singbox' group:

        sudo usermod -aG gui-for-singbox $USER

      Please log out and log back in (or reboot) for this to take effect.
=========================================================================

EOF

exit 0
