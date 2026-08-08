#!/bin/sh
# Universal post-install / post-upgrade script for gui-for-singbox

CAPS="cap_net_admin,cap_net_raw,cap_net_bind_service=ep"
CORE_DIR="/usr/lib/gui-for-singbox/cores"

if [ -n "$SUDO_USER" ] && [ "$SUDO_USER" != "root" ]; then
  TARGET_USER="$SUDO_USER"
elif [ -n "$USER" ] && [ "$USER" != "root" ]; then
  TARGET_USER="$USER"
else
  TARGET_USER="<username>"
fi

create_group() {
  if ! getent group gui-for-singbox >/dev/null 2>&1; then
    groupadd -r gui-for-singbox 2>/dev/null || echo "Warning: Failed to create group 'gui-for-singbox'."
  fi
}

apply_capabilities() {
  [ -d "$CORE_DIR" ] || return 0

  found_cores=""
  for binary in "$CORE_DIR/sing-box" "$CORE_DIR/sing-box-alpha"; do
    if [ -f "$binary" ]; then
      found_cores="$found_cores $binary"
    fi
  done

  [ -n "$found_cores" ] || return 0

  if command -v setcap >/dev/null 2>&1; then
    for binary in $found_cores; do
      if setcap "$CAPS" "$binary" 2>/dev/null; then
        echo "Capabilities set for: $binary"
      else
        echo "Warning: Failed to set capabilities for $binary"
        echo "         Manual command: sudo setcap \"$CAPS\" \"$binary\""
      fi
    done
  else
    echo "Warning: 'setcap' (libcap) not found. Network capabilities were not set automatically."
    echo "         Please install 'libcap' (or 'libcap2-bin' on Debian/Ubuntu) and run manually:"
    for binary in $found_cores; do
      echo "         sudo setcap \"$CAPS\" \"$binary\""
    done
  fi
}

show_notice() {
  cat <<EOF

=========================================================================
[OPTIONAL] Polkit Passwordless Elevation:
To manage TUN interfaces and routing without Polkit password prompts,
add user '$TARGET_USER' to the 'gui-for-singbox' group:

    sudo usermod -aG gui-for-singbox $TARGET_USER

Note:
- If skipped, the application will STILL WORK, but will require Polkit
  password authentication each time network settings are changed.
- Log out and log back in for group changes to take effect.
=========================================================================

EOF
}

action="install"

if [ "$1" = "configure" ]; then
  # Debian / Ubuntu
  [ -n "$2" ] && action="upgrade" || action="install"
elif [ -n "$1" ] && [ -n "$2" ]; then
  # Arch Linux post_upgrade ($1=new_ver, $2=old_ver)
  action="upgrade"
elif [ "$1" = "1" ]; then
  # RPM Initial Install
  action="install"
elif echo "$1" | grep -qE '^[0-9]+$' && [ "$1" -gt 1 ]; then
  # RPM Upgrade ($1 >= 2)
  action="upgrade"
else
  # Fallback (Arch post_install passes version string as $1, $2 is empty)
  action="install"
fi

create_group
apply_capabilities

if [ "$action" = "install" ]; then
  show_notice
fi

exit 0
