// Package build records the metadata of the running binary.
package build

import (
	"runtime"
	"runtime/debug"
)

// Unknown is the placeholder for build metadata that was not injected.
const Unknown = "unknown"

var (
	// Set by -ldflags in release builds.
	GitVersion   = Unknown
	GitCommit    = Unknown
	GitTreeState = Unknown
	BuildDate    = Unknown
	BuiltBy      = Unknown
	ModuleSum    = Unknown

	// SystemPackage records whether this binary was built for a system
	// package. Linux package builds inject "true" via -ldflags; "false"
	// disables the per-user directory layout, and unknown keeps the runtime
	// path-based detection in charge.
	SystemPackage = Unknown

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

	if ModuleSum == Unknown && info.Main.Sum != "" {
		ModuleSum = info.Main.Sum
	}

	for _, setting := range info.Settings {
		switch setting.Key {
		case "vcs.revision":
			if GitCommit == Unknown {
				GitCommit = shortRevision(setting.Value)
			}
		case "vcs.time":
			if BuildDate == Unknown {
				BuildDate = setting.Value
			}
		case "vcs.modified":
			if GitTreeState == Unknown {
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
