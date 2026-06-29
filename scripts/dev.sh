#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
cd "$SCRIPT_DIR" || exit 1
cd ..

export VITE_APP_VERSION="dev"

pnpm --dir frontend build-only
wails dev -s -tags webkit2_41
