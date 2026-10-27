package cli

import (
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"guiforcores/internal/appinfo"
	"guiforcores/internal/buildinfo"
)

type Action int

const (
	ActionLaunch Action = iota
	ActionQuit
	ActionExit
)

type Result struct {
	Action      Action
	ExitCode    int
	FromTaskSch bool
}

const appDesc = "A GUI client for sing-box"

func Run(args []string) Result {
	if len(args) == 0 {
		return Result{Action: ActionLaunch, ExitCode: 0}
	}

	stdout, stderr, cleanup := setupConsoleStreams()
	defer cleanup()

	return Parse(args, stdout, stderr)
}

// knownFlagNames lists every flag the CLI understands. Anything else is
// ignored by filterKnownFlags.
var knownFlagNames = map[string]struct{}{
	"h": {}, "help": {},
	"v": {}, "version": {},
	"q": {}, "quit": {},
	"t": {}, "tasksch": {},
}

// filterKnownFlags drops arguments the CLI does not define.
//
// Wails, OS launchers and desktop environments pass their own arguments (for
// example macOS `-psn_0_1234`). Treating those as fatal would stop the GUI
// from starting, so unknown flags and positional arguments are simply skipped.
// Parsing still stops at "--".
func filterKnownFlags(args []string) []string {
	filtered := make([]string, 0, len(args))

	for _, arg := range args {
		if arg == "--" {
			break
		}

		if arg == "-" || !strings.HasPrefix(arg, "-") {
			continue
		}

		name := strings.TrimLeft(arg, "-")
		if idx := strings.IndexByte(name, '='); idx >= 0 {
			name = name[:idx]
		}

		if _, ok := knownFlagNames[name]; ok {
			filtered = append(filtered, arg)
		}
	}

	return filtered
}

func Parse(args []string, stdout, stderr io.Writer) Result {
	if len(args) == 0 {
		return Result{Action: ActionLaunch, ExitCode: 0}
	}

	normalizedArgs := make([]string, len(args))
	copy(normalizedArgs, args)
	switch normalizedArgs[0] {
	case "help":
		normalizedArgs[0] = "--help"
	case "version":
		normalizedArgs[0] = "--version"
	case "quit":
		normalizedArgs[0] = "--quit"
	case "tasksch":
		normalizedArgs[0] = "--tasksch"
	}

	fs := flag.NewFlagSet(getProgramName(), flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	fs.Usage = func() {}

	var (
		help    bool
		version bool
		quit    bool
		tasksch bool
	)

	fs.BoolVar(&help, "h", false, "Show help information")
	fs.BoolVar(&help, "help", false, "Show help information")
	fs.BoolVar(&version, "v", false, "Show version information")
	fs.BoolVar(&version, "version", false, "Show version information")
	fs.BoolVar(&quit, "q", false, "Quit the running instance")
	fs.BoolVar(&quit, "quit", false, "Quit the running instance")
	fs.BoolVar(&tasksch, "t", false, "Run in background task scheduler mode")
	fs.BoolVar(&tasksch, "tasksch", false, "Run in background task scheduler mode")

	// Only known flags reach the parser, so a parse error here means a known
	// flag had an invalid value (for example `--version=maybe`).
	if err := fs.Parse(filterKnownFlags(normalizedArgs)); err != nil {
		fmt.Fprintf(stderr, "Error: %s\n\n", formatFlagError(err))
		PrintHelp(stderr)
		return Result{Action: ActionExit, ExitCode: 2}
	}

	if help {
		PrintHelp(stdout)
		return Result{Action: ActionExit, ExitCode: 0}
	}

	if version {
		PrintVersion(stdout)
		return Result{Action: ActionExit, ExitCode: 0}
	}

	if quit {
		return Result{Action: ActionQuit, ExitCode: 0}
	}

	return Result{
		Action:      ActionLaunch,
		ExitCode:    0,
		FromTaskSch: tasksch,
	}
}

func IsQuit(args []string) bool {
	for _, arg := range args {
		trimmed := strings.TrimLeft(arg, "-")
		if trimmed == "q" || trimmed == "quit" {
			return true
		}
	}
	return false
}

func PrintHelp(w io.Writer) {
	prog := getProgramName()
	fmt.Fprintf(w, "%s - %s\n\n", appinfo.Current.Title, appDesc)
	fmt.Fprintln(w, "Usage:")
	fmt.Fprintf(w, "  %s [flags]\n\n", prog)
	fmt.Fprintln(w, "Flags:")
	fmt.Fprintln(w, "  -h, --help       Show help information")
	fmt.Fprintln(w, "  -v, --version    Show version information")
	fmt.Fprintln(w, "  -q, --quit       Quit the running instance")
	fmt.Fprintln(w, "  -t, --tasksch    Run in background task scheduler mode")
}

func PrintVersion(w io.Writer) {
	fmt.Fprintf(w, "%s - %s\n\n", appinfo.Current.Title, appDesc)
	fmt.Fprintf(w, "Git version    : %s\n", buildinfo.GitVersion)
	fmt.Fprintf(w, "Git commit     : %s\n", buildinfo.GitCommit)
	fmt.Fprintf(w, "Git tree state : %s\n", buildinfo.GitTreeState)
	fmt.Fprintf(w, "Build date     : %s\n", buildinfo.BuildDate)
	fmt.Fprintf(w, "Built by       : %s\n", buildinfo.BuiltBy)
	fmt.Fprintf(w, "Go version     : %s\n", buildinfo.GoVersion)
	fmt.Fprintf(w, "Compiler       : %s\n", buildinfo.Compiler)
	fmt.Fprintf(w, "Module sum     : %s\n", buildinfo.ModuleSum)
	fmt.Fprintf(w, "Platform       : %s\n", buildinfo.Platform)

	if runtime.GOOS == "linux" {
		if IsLinuxSystemPackage() {
			fmt.Fprintln(w, "Package type   : System Package")
		} else {
			fmt.Fprintln(w, "Package type   : Portable")
		}
	}
}

// linuxSystemPrefixes lists directories that are owned by a system package
// manager on Linux. A binary installed there cannot safely replace itself, so
// self-update must be disabled.
var linuxSystemPrefixes = []string{
	"/usr/bin/",
	"/usr/sbin/",
	"/usr/local/bin/",
	"/opt/",
}

// IsLinuxSystemPackage reports whether the running binary was installed by a
// system package manager.
//
// The install location alone is not enough: a user may extract a portable
// tarball into /opt or /usr/local/bin. In that case the directory stays
// writable and an in-place self-update still works, so the binary is treated
// as portable.
func IsLinuxSystemPackage() bool {
	if runtime.GOOS != "linux" {
		return false
	}

	exePath, err := os.Executable()
	if err != nil {
		return false
	}

	if resolved, err := filepath.EvalSymlinks(exePath); err == nil {
		exePath = resolved
	}

	slashed := filepath.ToSlash(exePath)
	managed := false
	for _, prefix := range linuxSystemPrefixes {
		if strings.HasPrefix(slashed, prefix) {
			managed = true
			break
		}
	}

	return managed && !dirIsWritable(filepath.Dir(exePath))
}

// dirIsWritable reports whether the current process can create a file in dir.
func dirIsWritable(dir string) bool {
	f, err := os.CreateTemp(dir, ".write-test-*")
	if err != nil {
		return false
	}

	name := f.Name()
	_ = f.Close()
	_ = os.Remove(name)

	return true
}

func getProgramName() string {
	if len(os.Args) > 0 && os.Args[0] != "" {
		return filepath.Base(os.Args[0])
	}
	return appinfo.Current.ID
}

func formatFlagError(err error) string {
	msg := err.Error()
	if after, ok := strings.CutPrefix(msg, "flag provided but not defined: "); ok {
		return fmt.Sprintf("unknown flag: %s", after)
	}
	return msg
}
