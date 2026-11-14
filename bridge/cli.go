package bridge

import (
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
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

const appDesc string = "A GUI client for sing-box"

func HandleFlags(args []string) Result {
	if len(args) == 0 {
		return Result{Action: ActionLaunch, ExitCode: 0}
	}

	return parse(args, os.Stdout, os.Stderr)
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

var knownFlagNames = map[string]struct{}{
	"h": {}, "help": {},
	"v": {}, "version": {},
	"q": {}, "quit": {},
	"t": {}, "tasksch": {},
}

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
		Action:      ActionLaunch,
		ExitCode:    0,
		FromTaskSch: tasksch,
	}
}

func printHelp(w io.Writer) {
	prog := getProgramName()
	fmt.Fprintf(w, "%s - %s\n\n", prog, appDesc)
	fmt.Fprintln(w, "Usage:")
	fmt.Fprintf(w, "  %s [flags]\n\n", prog)
	fmt.Fprintln(w, "Flags:")
	fmt.Fprintln(w, "  -h, --help       Show help information")
	fmt.Fprintln(w, "  -v, --version    Show version information")
	fmt.Fprintln(w, "  -q, --quit       Quit the running instance")
	fmt.Fprintln(w, "  -t, --tasksch    Run in background task scheduler mode")
}

func printVersion(w io.Writer) {
	prog := getProgramName()
	fmt.Fprintf(w, "%s - %s\n\n", prog, appDesc)
	fmt.Fprintf(w, "Git version    : %s\n", GitVersion)
	fmt.Fprintf(w, "Git commit     : %s\n", GitCommit)
	fmt.Fprintf(w, "Git tree state : %s\n", GitTreeState)
	fmt.Fprintf(w, "Build date     : %s\n", BuildDate)
	fmt.Fprintf(w, "Built by       : %s\n", BuiltBy)
	fmt.Fprintf(w, "Go version     : %s\n", GoVersion)
	fmt.Fprintf(w, "Compiler       : %s\n", Compiler)
	fmt.Fprintf(w, "Module sum     : %s\n", ModuleSum)
	fmt.Fprintf(w, "Platform       : %s\n", Platform)
	fmt.Fprintf(w, "System package : %s\n", SystemPackage)
}

func getProgramName() string {
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
