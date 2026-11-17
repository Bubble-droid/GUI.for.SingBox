# bash completion for gui-for-singbox
#
# Install as /usr/share/bash-completion/completions/gui-for-singbox (or source
# it from ~/.bashrc).
#
# shellcheck disable=SC2207

_gui_for_singbox() {
  local cur prev opts
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  opts="-h --help -v --version -q --quit --data-dir --portable --window-start-state"

  case "$prev" in
  --data-dir)
    COMPREPLY=($(compgen -d -- "$cur"))
    return 0
    ;;
  --window-start-state)
    COMPREPLY=($(compgen -W "normal minimised" -- "$cur"))
    return 0
    ;;
  esac

  if [[ "$cur" == -* ]]; then
    COMPREPLY=($(compgen -W "$opts" -- "$cur"))
    return 0
  fi

  # Positional arguments are deep links or config files.
  COMPREPLY=($(compgen -f -- "$cur"))
}

complete -F _gui_for_singbox gui-for-singbox
