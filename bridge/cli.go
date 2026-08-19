package bridge

import (
	"flag"
	"fmt"
	"guiforcores/bridge/config"
	platform_console "guiforcores/bridge/platform/console"
	"os"
	"strings"
)

type CLIOperation int

const (
	CLIOpLaunchGUI CLIOperation = iota
	CLIOpExitNow
	CLIOpForwardIPC
)

const taskschInfo = "Run in background task scheduler mode"

func HandleCLI() CLIOperation {
	args := os.Args[1:]
	if len(args) == 0 {
		return CLIOpLaunchGUI
	}

	if IsQuitArg(args) {
		return CLIOpForwardIPC
	}

	firstArg := strings.TrimLeft(args[0], "-")
	switch firstArg {
	case "h", "help":
		platform_console.AttachParent()
		printHelp()
		return CLIOpExitNow
	case "v", "version":
		platform_console.AttachParent()
		printVersion()
		return CLIOpExitNow
	}

	fs := flag.NewFlagSet("app", flag.ContinueOnError)
	fs.SetOutput(os.Stderr)

	taskSch := fs.Bool("t", false, taskschInfo)
	fs.BoolVar(taskSch, "tasksch", false, taskschInfo)

	if err := fs.Parse(args); err != nil {
		platform_console.AttachParent()
		printHelp()
		return CLIOpExitNow
	}

	if *taskSch {
		Env.FromTaskSch = true
	}

	return CLIOpLaunchGUI
}

func IsQuitArg(args []string) bool {
	for _, arg := range args {
		cleaned := strings.TrimLeft(arg, "-")
		if cleaned == "q" || cleaned == "quit" {
			return true
		}
	}
	return false
}

func printHelp() {
	fmt.Printf("%s - A GUI client for sing-box\n\n", config.Info.AppTitle)
	fmt.Println("Usage:")
	fmt.Printf("  %s [flags]\n\n", Env.ExecName)
	fmt.Println("Flags:")
	fmt.Println("  -h, --help       Show help information")
	fmt.Println("  -v, --version    Show version information")
	fmt.Println("  -q, --quit       Quit the running instance")
	fmt.Println("  -t, --tasksch    Run in background task scheduler mode")
}

func printVersion() {
	fmt.Printf("%s version %s %s/%s\n", config.Info.AppTitle, config.Info.AppVersion, Env.OS, Env.ARCH)

	if Env.OS == "linux" {
		if Env.IsSystemPackage {
			if Env.IsBundled {
				fmt.Println("Package Type : System Package (Bundled Cores)")
				if config.Info.SingBoxVersion != "" && config.Info.SingBoxVersion != "unknown" {
					fmt.Printf("  sing-box (stable): v%s\n", config.Info.SingBoxVersion)
				}
				if config.Info.SingBoxAlphaVersion != "" && config.Info.SingBoxAlphaVersion != "unknown" {
					fmt.Printf("  sing-box (alpha) : v%s\n", config.Info.SingBoxAlphaVersion)
				}
			} else {
				fmt.Println("Package Type : System Package (Vanilla)")
			}
		} else {
			fmt.Println("Package Type : Portable")
		}
		return
	}
}
