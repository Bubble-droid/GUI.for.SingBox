# fish completion for gui-for-singbox
#
# Install as /usr/share/fish/vendor_completions.d/gui-for-singbox.fish.

complete -c gui-for-singbox -s h -l help -d 'Show help information'
complete -c gui-for-singbox -s v -l version -d 'Show version information'
complete -c gui-for-singbox -s q -l quit -d 'Quit the running instance'
complete -c gui-for-singbox -l data-dir -d 'Use a custom data directory for this run' -r -a '(__fish_complete_directories)'
complete -c gui-for-singbox -l portable -d 'Keep data next to the application for this run'
complete -c gui-for-singbox -l window-start-state -d 'Start the window normal or minimised for this run' -x -a 'normal minimised'
