//go:build linux

package bridge

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/adrg/xdg"
)

const appDirName = "gui-for-singbox"

// userConfigBase returns the per-user config directory root on Linux.
func userConfigBase() string {
	return filepath.ToSlash(xdg.ConfigHome)
}

// portableRoot returns the app root hosting portable data. On Linux the binary
// runs from the app root directly, so portable data lives next to the binary
// (i.e. BasePath).
func portableRoot() string {
	return Env.BasePath
}

// systemPackagePrefixes lists directories that indicate a system-wide
// installation (e.g. via a package manager).
var systemPackagePrefixes = []string{
	"/usr/",
	"/opt/",
	"/snap/",
	"/var/lib/flatpak/",
}

// isSystemPackageBuild reports whether the binary was built for a system
// package. The injected build variable is the only source of truth for the
// value exposed to the frontend.
func isSystemPackageBuild() bool {
	return SystemPackage == "true"
}

// isSystemPackage decides the directory layout. The injected build variable
// wins when present; otherwise the path-based detection below keeps older
// binaries working as a compatibility fallback.
func isSystemPackage() bool {
	switch SystemPackage {
	case "true":
		return true
	case "false":
		return false
	}
	return detectSystemPackagePath()
}

func detectSystemPackagePath() bool {
	exe, err := os.Executable()
	if err != nil {
		return false
	}

	realPath, err := filepath.EvalSymlinks(exe)
	if err != nil {
		realPath = exe
	}

	for _, prefix := range systemPackagePrefixes {
		if strings.HasPrefix(realPath, prefix) {
			return true
		}
	}

	return false
}
