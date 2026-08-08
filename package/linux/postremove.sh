#!/bin/sh
# Universal post-remove script for gui-for-singbox

GROUP_NAME="gui-for-singbox"

action="ignore"

if [ "$1" = "remove" ] || [ "$1" = "purge" ] || [ "$1" = "0" ]; then
  # DEB (remove/purge) or RPM (postun 0)
  action="remove"
elif [ "$1" = "1" ] || [ "$1" = "upgrade" ]; then
  # RPM upgrade (postun 1) or DEB upgrade (postrm upgrade)
  action="ignore"
elif [ -n "$1" ]; then
  # Arch Linux post_remove ($1 = version string)
  action="remove"
fi

if [ "$action" = "remove" ]; then
  if getent group "$GROUP_NAME" >/dev/null 2>&1; then
    echo "Notice: System group '$GROUP_NAME' was not automatically removed."
    echo "        If you no longer need it, you can manually remove it using:"
    echo "        sudo groupdel $GROUP_NAME"
  fi
fi

exit 0
