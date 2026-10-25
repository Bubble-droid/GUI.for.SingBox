package buildinfo

import (
	"runtime"
	"runtime/debug"
)

const unknown = "unknown"

var (
	// Set by -ldflags in release builds; see doc.go.
	GitVersion   = unknown
	GitCommit    = unknown
	GitTreeState = unknown
	BuildDate    = unknown
	BuiltBy      = unknown
	ModuleSum    = unknown

	GoVersion = runtime.Version()
	Compiler  = runtime.Compiler
	Platform  = runtime.GOOS + "/" + runtime.GOARCH
)

func init() {
	info, ok := debug.ReadBuildInfo()
	if !ok {
		return
	}

	GoVersion = info.GoVersion

	if ModuleSum == unknown && info.Main.Sum != "" {
		ModuleSum = info.Main.Sum
	}

	for _, setting := range info.Settings {
		switch setting.Key {
		case "vcs.revision":
			if GitCommit == unknown {
				GitCommit = shortRevision(setting.Value)
			}
		case "vcs.time":
			if BuildDate == unknown {
				BuildDate = setting.Value
			}
		case "vcs.modified":
			if GitTreeState == unknown {
				GitTreeState = treeState(setting.Value)
			}
		}
	}
}

func shortRevision(rev string) string {
	const shortLen = 12
	if len(rev) > shortLen {
		return rev[:shortLen]
	}
	return rev
}

func treeState(modified string) string {
	if modified == "true" {
		return "dirty"
	}
	return "clean"
}
