//go:build !linux

package bridge

import (
	"os"
	"path/filepath"
	"strings"
)

// On non-Linux platforms (macOS, Windows) the per-user data/cache home names
// follow upstream and use the canonical app name rather than the Linux kebab
// case directory. Only Linux uses the XDG-style kebab-case folder name.
const appDirName = "GUI.for.SingBox"

// userConfigBase returns the per-user config directory root on platforms
// other than Linux. os.UserConfigDir maps to the platform convention
// (AppData on Windows, Application Support on macOS).
func userConfigBase() string {
	dir, err := os.UserConfigDir()
	if err != nil {
		return ""
	}
	return filepath.ToSlash(dir)
}

// portableRoot returns the directory that should host portable data. On macOS
// the app lives in a bundle Foo.app/Contents/MacOS/<exe>; portable data sits
// beside the .app root, so strip the bundle-internal segments. This mirrors
// upstream: it always yields the app root and only that root is probed.
func portableRoot() string {
	root := Env.BasePath
	if Env.OS == "darwin" {
		if bundle, ok := strings.CutSuffix(root, ".app/Contents/MacOS"); ok {
			root = filepath.Dir(bundle)
		}
	}
	return root
}

// isSystemPackageBuild reports whether the binary was built for a system
// package. The injected build variable is the only source of truth.
func isSystemPackageBuild() bool {
	return SystemPackage == "true"
}

// isSystemPackage is only meaningful on Linux. On other platforms no system
// package detection is performed, so this always reports false.
func isSystemPackage() bool {
	return false
}
