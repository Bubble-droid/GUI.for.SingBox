#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
	echo "Failed: Missing release version." >&2
	echo "Use: $0 <RELEASE_VERSION>" >&2
	exit 1
fi

RELEASE_VERSION="$1"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
cd "$SCRIPT_DIR" || exit 1
cd ..

git push -f origin feat/xdg-base-directory
git tag -a "$RELEASE_VERSION" -m "Release $RELEASE_VERSION"
git push -f origin "$RELEASE_VERSION"
