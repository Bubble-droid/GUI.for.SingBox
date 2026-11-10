//go:build linux

package bridge

import (
	"os"
	"path/filepath"
	"strings"
)

const appDirName = "gui-for-singbox"

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

func isSystemPackage() bool {
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
