package bridge

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/adrg/xdg"
)

func resolvePath(path string) string {
	cleanPath := filepath.ToSlash(filepath.Clean(path))

	if filepath.IsAbs(cleanPath) {
		return cleanPath
	}

	if rel, ok := trimCachePrefix(cleanPath); ok {
		resolvedPath := filepath.ToSlash(filepath.Join(cacheDir(), rel))
		logResolvedPath(path, resolvedPath)
		return resolvedPath
	}

	if rel, ok := trimDataPrefix(cleanPath); ok {
		resolvedPath := filepath.ToSlash(filepath.Join(dataDir(), rel))
		logResolvedPath(path, resolvedPath)
		return resolvedPath
	}

	resolvedPath := filepath.ToSlash(filepath.Join(Env.BasePath, cleanPath))
	logResolvedPath(path, resolvedPath)
	return resolvedPath
}

func trimDataPrefix(path string) (string, bool) {
	if path == "data" {
		return "", true
	}
	if rest, ok := strings.CutPrefix(path, "data/"); ok {
		return rest, true
	}
	return "", false
}

func trimCachePrefix(path string) (string, bool) {
	const prefix = "data/.cache"
	if path == prefix {
		return "", true
	}
	if rest, ok := strings.CutPrefix(path, prefix+"/"); ok {
		return rest, true
	}
	return "", false
}

func cacheDir() string {
	if appCacheDir != "" {
		return appCacheDir
	}
	// Fallback: under the data directory, preserving the old layout.
	return filepath.ToSlash(filepath.Join(Env.DataDir, ".cache"))
}

func dataDir() string {
	return Env.DataDir
}

// xdgDataDir returns the per-user XDG data directory for the app.
func xdgDataDir() string {
	return filepath.ToSlash(filepath.Join(xdg.DataHome, appDirName))
}

// xdgCacheDir returns the per-user XDG cache directory for the app.
func xdgCacheDir() string {
	return filepath.ToSlash(filepath.Join(xdg.CacheHome, appDirName))
}

// appCacheDir holds the resolved cache directory; empty means fall back to
// dataDir/.cache, preserving the portable self-contained layout. It is
// package-internal and not part of Env.
var appCacheDir string

// portableMarkerExists reports whether the portable marker file exists.
func portableMarkerExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// isDirWritable reports whether dir can host new files (i.e. is writable).
func isDirWritable(dir string) bool {
	f, err := os.CreateTemp(dir, ".write-test-*")
	if err != nil {
		return false
	}
	name := f.Name()
	f.Close()
	os.Remove(name)
	return true
}

// ensureDirs creates the target data and cache directories up front; later
// read/write operations (config load, pid lock, embedded extraction) rely on
// their existence.
func ensureDirs() {
	if err := os.MkdirAll(Env.DataDir, os.ModePerm); err != nil {
		log.Printf("Failed to create data directory %s: %v", Env.DataDir, err)
	}
	if err := os.MkdirAll(cacheDir(), os.ModePerm); err != nil {
		log.Printf("Failed to create cache directory %s: %v", cacheDir(), err)
	}
}

// initDataDir resolves the data and cache directories for the current
// installation. The resolution order is:
//  1. Installed as a system package (Linux) — always use XDG directories.
//  2. App binary directory is not writable — use XDG directories.
//  3. Portable marker exists next to the app root — stay self-contained:
//     data under root/data, cache under data/.cache (appCacheDir left empty).
//  4. Default — use XDG directories.
//
// Platform hooks are supplied by the platform files:
//   - portableRoot: the app root hosting portable data (macOS strips the
//     bundle-internal .app/Contents/MacOS segments; Linux is BasePath).
//   - isSystemPackage: real detection on Linux, always false elsewhere.
func initDataDir() {
	root := portableRoot()
	portableMarker := filepath.Join(root, "data", "user.yaml")

	switch {
	case isSystemPackage():
		Env.IsSystemPackage = true
		Env.DataDir = xdgDataDir()
		appCacheDir = xdgCacheDir()
	case !isDirWritable(Env.BasePath):
		Env.DataDir = xdgDataDir()
		appCacheDir = xdgCacheDir()
	case portableMarkerExists(portableMarker):
		Env.DataDir = filepath.ToSlash(filepath.Join(root, "data"))
		appCacheDir = ""
	default:
		Env.DataDir = xdgDataDir()
		appCacheDir = xdgCacheDir()
	}

	ensureDirs()
}

func logResolvedPath(rawPath string, resolvedPath string) {
	if isDev {
		log.Printf("resolvePath: %q -> %s", rawPath, maskUserHome(resolvedPath))
	}
}

func maskUserHome(targetPath string) string {
	if targetPath == "" {
		return ""
	}

	homeDir, err := os.UserHomeDir()
	if err != nil || homeDir == "" {
		return targetPath
	}

	rel, err := filepath.Rel(homeDir, targetPath)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return targetPath
	}

	if rel == "." {
		return "~"
	}

	return filepath.Join("~", rel)
}
