#!/bin/sh
# Launch wrapper for gui-for-singbox.
#
# The real binary lives in /usr/lib so the package can ship it together with
# the bundled sing-box cores. The application expects its cores in the user
# data directory, so expose the bundled ones as symlinks there. The root
# daemon normally runs the packaged cores itself; the symlinks keep local
# launches working when the daemon is unavailable. Existing files are left
# untouched: a core downloaded or replaced by the user always wins.
#
# The data directory follows the effective launch flags: --data-dir on the
# command line, then a data-dir line in the fixed flags.conf file, then the
# per-user XDG data directory.

set -eu

PKG_NAME="gui-for-singbox"
LIB_DIR="/usr/lib/$PKG_NAME"
APP_BIN="$LIB_DIR/$PKG_NAME"
CORES_DIR="$LIB_DIR/cores"

# trim strips leading and trailing whitespace, matching the flags file parser
# in internal/cli/flagsfile.go.
trim() {
  printf '%s' "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

# args_data_dir prints the last --data-dir value on the command line. Both
# --data-dir=path and --data-dir path are accepted, and an empty value means
# no override, exactly as the application treats it.
args_data_dir() {
  result=""
  expect_value=0

  for arg in "$@"; do
    if [ "$expect_value" -eq 1 ]; then
      result="$arg"
      expect_value=0
      continue
    fi

    if [ "$arg" = "--" ]; then
      break
    fi

    case "$arg" in
    --data-dir=*)
      result="${arg#*=}"
      ;;
    --data-dir|-data-dir)
      expect_value=1
      ;;
    esac
  done

  printf '%s' "$result"
}

# flags_data_dir prints the last data-dir line from the fixed flags file. The
# file accepts --data-dir=path, --data-dir path and comment lines.
flags_data_dir() {
  file="$1"
  [ -f "$file" ] || return 0

  result=""
  while IFS= read -r line || [ -n "$line" ]; do
    line=$(trim "$line")
    case "$line" in
    "" | "#"*)
      continue
      ;;
    -*)
      ;;
    *)
      continue
      ;;
    esac

    name="$line"
    while [ "${name#-}" != "$name" ]; do
      name="${name#-}"
    done

    case "$name" in
    data-dir=*)
      value=$(trim "${name#data-dir=}")
      [ -n "$value" ] && result="$value"
      ;;
    data-dir|data-dir[[:space:]]*)
      value=$(trim "${name#data-dir}")
      [ -n "$value" ] && result="$value"
      ;;
    esac
  done <"$file"

  printf '%s' "$result"
}

# resolve_path expands a leading ~ and turns relative paths into absolute ones
# resolved against the working directory, as the application does. Environment
# variables inside the value are left to the application.
resolve_path() {
  path="$1"

  # shellcheck disable=SC2088 # these patterns match a literal leading tilde
  case "$path" in
  "~")
    path="${HOME:-}"
    ;;
  "~/"*)
    path="${HOME:+${HOME}/}${path#"~/"}"
    ;;
  esac

  case "$path" in
  /*)
    ;;
  "")
    ;;
  *)
    path="$(pwd)/$path"
    ;;
  esac

  printf '%s' "$path"
}

config_home=""
if [ -n "${XDG_CONFIG_HOME:-}" ]; then
  case "$XDG_CONFIG_HOME" in
  /*) config_home="$XDG_CONFIG_HOME" ;;
  esac
fi
if [ -z "$config_home" ]; then
  config_home="${HOME:-}/.config"
fi

data_home=""
if [ -n "${XDG_DATA_HOME:-}" ]; then
  case "$XDG_DATA_HOME" in
  /*) data_home="$XDG_DATA_HOME" ;;
  esac
fi
if [ -z "$data_home" ]; then
  data_home="${HOME:+${HOME}/.local/share}"
fi

data_dir=$(args_data_dir "$@")
if [ -z "$data_dir" ]; then
  data_dir=$(flags_data_dir "$config_home/$PKG_NAME/flags.conf")
fi
if [ -n "$data_dir" ]; then
  data_dir=$(resolve_path "$data_dir")
else
  data_dir="${data_home:+${data_home}/$PKG_NAME}"
fi

if [ -n "$data_dir" ]; then
  core_work_dir="$data_dir/sing-box"

  # link_core <bundled core> <path used by the application>
  link_core() {
    bundled="$1"
    target="$2"
    if [ -e "$bundled" ] && [ ! -e "$target" ] && [ ! -L "$target" ]; then
      ln -s "$bundled" "$target" 2>/dev/null || true
    fi
  }

  if mkdir -p "$core_work_dir" 2>/dev/null; then
    # Stable and alpha channels are stored as sing-box and sing-box-latest by
    # the application (see getKernelFileName in frontend/src/utils/helper.ts).
    link_core "$CORES_DIR/sing-box" "$core_work_dir/sing-box"
    link_core "$CORES_DIR/sing-box-alpha" "$core_work_dir/sing-box-latest"
  fi
fi

exec "$APP_BIN" "$@"
