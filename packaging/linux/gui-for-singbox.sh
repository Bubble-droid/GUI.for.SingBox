#!/bin/sh
# Launch wrapper for gui-for-singbox.
#
# The real binary lives in /usr/lib so the package can ship it together with
# the bundled sing-box cores. A system package uses the root daemon to manage
# those cores, so no symlinks are created in the user data directory.

set -eu

exec "/usr/lib/gui-for-singbox/gui-for-singbox" "$@"
