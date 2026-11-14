#!/bin/sh
# Post-install script for gui-for-singbox (default for every platform).
# Distributions that need extra output, such as dependency hints, override it
# from scripts/<platform>/postinstall.sh.

set -eu

PKG_NAME="gui-for-singbox"
CORE_DIR="/usr/lib/$PKG_NAME/cores"
CAPABILITIES="cap_net_admin,cap_net_raw,cap_net_bind_service=ep"

if ! getent group "$PKG_NAME" >/dev/null 2>&1; then
  if groupadd -r "$PKG_NAME"; then
    echo "Created system group '$PKG_NAME'."
    echo "To manage TUN interfaces and routing without Polkit password prompts, add your user to the '$PKG_NAME' group."
  else
    echo "Warning: Failed to create group '$PKG_NAME'." >&2
  fi
fi

# Upgrades replace the bundled cores and drop their file capabilities, so
# re-apply them on every install and upgrade.
if command -v setcap >/dev/null 2>&1; then
  echo "Applying capabilities '$CAPABILITIES' to bundled cores in '$CORE_DIR'."
  for core in "$CORE_DIR/sing-box" "$CORE_DIR/sing-box-alpha"; do
    if [ -f "$core" ]; then
      if setcap "$CAPABILITIES" "$core"; then
        echo "Applied capabilities to '$core'."
      else
        echo "Warning: Failed to set capabilities on '$core'." >&2
      fi
    else
      echo "Warning: Bundled core '$core' not found; skipping." >&2
    fi
  done
else
  echo "Warning: 'setcap' not found; bundled cores may fail to manage TUN interfaces." >&2
fi

exit 0
