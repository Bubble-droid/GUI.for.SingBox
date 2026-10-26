#!/bin/sh
# Universal post-install / post-upgrade script for gui-for-singbox

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

show_notice() {
  cat <<EOF
Note: To manage TUN interfaces and routing without Polkit password prompts,
      add user '$TARGET_USER' to the 'gui-for-singbox' group:
          sudo usermod -aG gui-for-singbox $TARGET_USER
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

if [ "$action" = "install" ]; then
  show_notice
fi

exit 0
