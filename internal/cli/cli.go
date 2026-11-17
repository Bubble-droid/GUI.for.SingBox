// Package cli parses command-line flags for the application.
package cli

import (
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/Bubble-droid/GUI.for.SingBox/internal/info"
)

// Action is the startup action requested by the command line.
type Action int

const (
	ActionLaunch Action = iota
	ActionQuit
	ActionExit
)

// Result is the outcome of parsing the command line.
type Result struct {
	Action   Action
	ExitCode int

	// Launch overrides apply to this run only; normal startup passes none of
	// them and keeps whatever is persisted in the settings.
	DataDir          string
	Portable         bool
	WindowStartState string

	// Positional holds non-flag arguments such as deep links or file paths.
	Positional []string
}

const appDesc string = "A GUI client for sing-box"

// HandleFlags parses the process arguments and returns the requested action.
func HandleFlags(args []string) Result {
	if len(args) == 0 {
		return Result{Action: ActionLaunch, ExitCode: 0}
	}

	return parse(args, os.Stdout, os.Stderr)
}

// IsQuit reports whether args request quitting the running instance.
func IsQuit(args []string) bool {
	for _, arg := range args {
		trimmed := strings.TrimLeft(arg, "-")
		if trimmed == "q" || trimmed == "quit" {
			return true
		}
	}
	return false
}

var knownFlagNames = map[string]struct{}{
	"h": {}, "help": {},
	"v": {}, "version": {},
	"q": {}, "quit": {},
	"data-dir": {}, "portable": {},
	"window-start-state": {},
}

// valueFlagNames lists flags that consume the following argument when they are
// not written as --flag=value.
var valueFlagNames = map[string]struct{}{
	"data-dir":           {},
	"window-start-state": {},
}

func filterKnownFlags(args []string) []string {
	filtered := make([]string, 0, len(args))
	expectValue := false

	for _, arg := range args {
		if arg == "--" {
			break
		}

		if expectValue {
			filtered = append(filtered, arg)
			expectValue = false
			continue
		}

		if arg == "-" || !strings.HasPrefix(arg, "-") {
			continue
		}

		name := strings.TrimLeft(arg, "-")
		hasValue := false
		if idx := strings.IndexByte(name, '='); idx >= 0 {
			name = name[:idx]
			hasValue = true
		}

		if _, ok := knownFlagNames[name]; !ok {
			continue
		}

		filtered = append(filtered, arg)

		if _, ok := valueFlagNames[name]; ok && !hasValue {
			expectValue = true
		}
	}

	return filtered
}

// positionalArgs returns the non-flag arguments, such as deep links or file
// paths, skipping flags and the values they consume.
func positionalArgs(args []string) []string {
	positional := make([]string, 0, len(args))
	expectValue := false
	literal := false

	for _, arg := range args {
		if literal {
			positional = append(positional, arg)
			continue
		}
		if arg == "--" {
			literal = true
			continue
		}

		if expectValue {
			expectValue = false
			continue
		}

		if arg == "-" || !strings.HasPrefix(arg, "-") {
			positional = append(positional, arg)
			continue
		}

		name := strings.TrimLeft(arg, "-")
		hasValue := false
		if idx := strings.IndexByte(name, '='); idx >= 0 {
			name = name[:idx]
			hasValue = true
		}

		if _, ok := valueFlagNames[name]; ok && !hasValue {
			expectValue = true
		}
	}

	return positional
}

func parse(args []string, stdout, stderr io.Writer) Result {
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
	}

	fs := flag.NewFlagSet(programName(), flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	fs.Usage = func() {}

	var (
		help             bool
		version          bool
		quit             bool
		dataDir          string
		portable         bool
		windowStartState string
	)

	fs.BoolVar(&help, "h", false, "Show help information")
	fs.BoolVar(&help, "help", false, "Show help information")
	fs.BoolVar(&version, "v", false, "Show version information")
	fs.BoolVar(&version, "version", false, "Show version information")
	fs.BoolVar(&quit, "q", false, "Quit the running instance")
	fs.BoolVar(&quit, "quit", false, "Quit the running instance")
	fs.StringVar(&dataDir, "data-dir", "", "Use a custom data directory for this run")
	fs.BoolVar(&portable, "portable", false, "Keep data next to the application for this run")
	fs.Func("window-start-state", "Window start state: normal or minimised", func(v string) error {
		switch strings.ToLower(v) {
		case "normal":
			windowStartState = "normal"
		case "minimised":
			windowStartState = "minimised"
		default:
			return fmt.Errorf("invalid window start state %q (want normal or minimised)", v)
		}
		return nil
	})

	if err := fs.Parse(filterKnownFlags(normalizedArgs)); err != nil {
		fmt.Fprintf(stderr, "Error: %s\n\n", formatFlagError(err))
		printHelp(stderr)
		return Result{Action: ActionExit, ExitCode: 2}
	}

	if help {
		printHelp(stdout)
		return Result{Action: ActionExit, ExitCode: 0}
	}

	if version {
		printVersion(stdout)
		return Result{Action: ActionExit, ExitCode: 0}
	}

	if quit {
		return Result{Action: ActionQuit, ExitCode: 0}
	}

	return Result{
		Action:           ActionLaunch,
		ExitCode:         0,
		DataDir:          dataDir,
		Portable:         portable,
		WindowStartState: windowStartState,
		Positional:       positionalArgs(args),
	}
}

func printHelp(w io.Writer) {
	prog := programName()
	fmt.Fprintf(w, "%s - %s\n\n", prog, appDesc)
	fmt.Fprintln(w, "Usage:")
	fmt.Fprintf(w, "  %s [flags]\n\n", prog)
	fmt.Fprintln(w, "Flags:")
	fmt.Fprintln(w, "  -h, --help                    Show help information")
	fmt.Fprintln(w, "  -v, --version                 Show version information")
	fmt.Fprintln(w, "  -q, --quit                    Quit the running instance")
	fmt.Fprintln(w, "      --data-dir <path>         Use a custom data directory for this run")
	fmt.Fprintln(w, "      --portable                Keep data next to the application for this run")
	fmt.Fprintln(w, "      --window-start-state <s>  Start the window normal or minimised for this run")
}

func printVersion(w io.Writer) {
	prog := programName()
	fmt.Fprintf(w, "%s - %s\n\n", prog, appDesc)
	fmt.Fprintf(w, "Git version    : %s\n", info.Current.GitVersion)
	fmt.Fprintf(w, "Git commit     : %s\n", info.Current.GitCommit)
	fmt.Fprintf(w, "Git tree state : %s\n", info.Current.GitTreeState)
	fmt.Fprintf(w, "Build date     : %s\n", info.Current.BuildDate)
	fmt.Fprintf(w, "Built by       : %s\n", info.Current.BuiltBy)
	fmt.Fprintf(w, "Go version     : %s\n", info.Current.GoVersion)
	fmt.Fprintf(w, "Compiler       : %s\n", info.Current.Compiler)
	fmt.Fprintf(w, "Module sum     : %s\n", info.Current.ModuleSum)
	fmt.Fprintf(w, "Platform       : %s\n", info.Current.Platform)
	fmt.Fprintf(w, "System package : %s\n", info.Current.SystemPackage)
}

// programName returns the application name injected by the caller, falling
// back to the executable name when none was provided.
func programName() string {
	execPath, err := os.Executable()
	if err != nil {
		panic(err)
	}
	return filepath.Base(execPath)
}

func formatFlagError(err error) string {
	msg := err.Error()
	if after, ok := strings.CutPrefix(msg, "flag provided but not defined: "); ok {
		return fmt.Sprintf("unknown flag: %s", after)
	}
	return msg
}
