#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
BIN_DIR="$ROOT_DIR/.bin"
mkdir -p "$BIN_DIR"

TOOLS=("$@")
if [ ${#TOOLS[@]} -eq 0 ]; then
  TOOLS=(lefthook wails nfpm)
fi

for tool in "${TOOLS[@]}"; do
  case "$tool" in
  lefthook)
    echo "==> Installing lefthook..."
    GOBIN="$BIN_DIR" go install github.com/evilmartians/lefthook/v2@v2.2.2
    ;;
  wails)
    echo "==> Installing wails CLI..."
    WAILS_VER="$(go list -m -f '{{.Version}}' github.com/wailsapp/wails/v2 2>/dev/null | head -n1 || echo "")"
    if [[ -z "${WAILS_VER}" || "${WAILS_VER}" == "<nil>" ]]; then
      WAILS_VER="v2.17.0"
    fi
    echo "    Using wails CLI version: ${WAILS_VER}"
    GOBIN="$BIN_DIR" go install "github.com/wailsapp/wails/v2/cmd/wails@${WAILS_VER}"
    ;;
  nfpm)
    echo "==> Installing nfpm..."
    GOBIN="$BIN_DIR" go install -C "$ROOT_DIR/tools" github.com/goreleaser/nfpm/v2/cmd/nfpm
    ;;
  *)
    echo "==> Error: Unknown tool '$tool'" >&2
    echo "Supported: lefthook wails nfpm" >&2
    exit 1
    ;;
  esac
done
