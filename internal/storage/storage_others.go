//go:build !linux

package storage

import (
	"path/filepath"
	"strings"
)

// On non-Linux platforms (macOS, Windows) the per-user data/cache home names
// follow upstream and use the canonical app name rather than the Linux kebab
// case directory. Only Linux uses the XDG-style kebab-case folder name.
const appDirName = "GUI.for.SingBox"

// portableRoot returns the directory that should host portable data. On macOS
// the app lives in a bundle Foo.app/Contents/MacOS/<exe>; portable data sits
// beside the .app root, so strip the bundle-internal segments. This mirrors
// upstream: it always yields the app root and only that root is probed.
func portableRoot(cfg Config) string {
	root := cfg.BasePath
	if cfg.OS == "darwin" {
		if bundle, ok := strings.CutSuffix(root, ".app/Contents/MacOS"); ok {
			root = filepath.Dir(bundle)
		}
	}
	return root
}

// isSystemPackage is only meaningful on Linux. On other platforms no system
// package detection is performed, so this always reports false.
func (s *Storage) isSystemPackage() bool {
	return false
}
