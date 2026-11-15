package bridge

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/adrg/xdg"
)

const (
	dataLogicalPrefix   = "data"
	configLogicalPrefix = "data/config"
	cacheLogicalPrefix  = "data/.cache"
)

func resolvePath(path string) string {
	cleanPath := filepath.ToSlash(filepath.Clean(path))

	if filepath.IsAbs(cleanPath) {
		return cleanPath
	}

	if rel, ok := trimLogicalPrefix(cleanPath, cacheLogicalPrefix); ok {
		resolvedPath := filepath.ToSlash(filepath.Join(cacheDir(), rel))
		logResolvedPath(path, resolvedPath)
		return resolvedPath
	}

	if rel, ok := trimLogicalPrefix(cleanPath, configLogicalPrefix); ok {
		resolvedPath := filepath.ToSlash(filepath.Join(configDir(), rel))
		logResolvedPath(path, resolvedPath)
		return resolvedPath
	}

	if rel, ok := trimLogicalPrefix(cleanPath, dataLogicalPrefix); ok {
		resolvedPath := filepath.ToSlash(filepath.Join(dataDir(), rel))
		logResolvedPath(path, resolvedPath)
		return resolvedPath
	}

	resolvedPath := filepath.ToSlash(filepath.Join(Env.BasePath, cleanPath))
	logResolvedPath(path, resolvedPath)
	return resolvedPath
}

func trimLogicalPrefix(path string, prefix string) (string, bool) {
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

func configDir() string {
	if appConfigDir != "" {
		return appConfigDir
	}
	// Fallback: under the data directory, preserving the portable layout.
	return filepath.ToSlash(filepath.Join(Env.DataDir, "config"))
}

func dataDir() string {
	return Env.DataDir
}

// xdgDataDir returns the per-user data directory for the app.
func xdgDataDir() string {
	return filepath.ToSlash(filepath.Join(xdg.DataHome, appDirName))
}

// xdgCacheDir returns the per-user cache directory for the app.
func xdgCacheDir() string {
	return filepath.ToSlash(filepath.Join(xdg.CacheHome, appDirName))
}

// userConfigDir returns the per-user config directory for the app.
func userConfigDir() string {
	base := userConfigBase()
	if base == "" {
		return filepath.ToSlash(filepath.Join(Env.DataDir, "config"))
	}
	return filepath.ToSlash(filepath.Join(base, appDirName))
}

// appCacheDir and appConfigDir hold the resolved cache and config
// directories; empty means fall back to a subdirectory of Env.DataDir,
// preserving the portable self-contained layout. They are package-internal
// and not part of Env.
var (
	appCacheDir  string
	appConfigDir string
)

// portableDataDirExists reports whether the portable data directory exists.
// Only the data directory itself is probed, never its contents.
func portableDataDirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
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
	if err := os.MkdirAll(configDir(), os.ModePerm); err != nil {
		log.Printf("Failed to create config directory %s: %v", configDir(), err)
	}
}

// legacyConfigFiles lists the YAML files that used to live directly in the
// data directory before configuration was moved into its own directory.
var legacyConfigFiles = []string{
	"user.yaml",
	"profiles.yaml",
	"subscribes.yaml",
	"rulesets.yaml",
	"plugins.yaml",
	"scheduledtasks.yaml",
}

// migrateLegacyConfigs moves configuration files from the old data directory
// to the config directory. Existing files in the target directory always win.
func migrateLegacyConfigs(sourceDir string, targetDir string) {
	if filepath.Clean(sourceDir) == filepath.Clean(targetDir) {
		return
	}

	for _, name := range legacyConfigFiles {
		source := filepath.Join(sourceDir, name)
		target := filepath.Join(targetDir, name)

		info, err := os.Stat(source)
		if err != nil || info.IsDir() {
			continue
		}
		if _, err := os.Stat(target); err == nil {
			continue
		}
		if err := os.MkdirAll(targetDir, os.ModePerm); err != nil {
			log.Printf("Failed to create config directory %s: %v", targetDir, err)
			continue
		}
		if err := moveFileAcrossDevices(source, target); err != nil {
			log.Printf("Failed to migrate legacy config %s: %v", maskUserHome(source), err)
			continue
		}
		log.Printf("Migrated legacy config: %s", maskUserHome(target))
	}
}

// initDataDir resolves the data, cache and config directories for the current
// installation. The resolution order is:
//  1. Installed as a system package (Linux) — always use per-user directories.
//  2. App binary directory is not writable — use per-user directories.
//  3. Portable data directory exists next to the app root — stay
//     self-contained: data under root/data, config under data/config and cache
//     under data/.cache.
//  4. Default — use per-user directories.
//
// Platform hooks are supplied by the platform files:
//   - portableRoot: the app root hosting portable data (macOS strips the
//     bundle-internal .app/Contents/MacOS segments; Linux is BasePath).
//   - isSystemPackage: real detection on Linux, always false elsewhere.
//   - userConfigBase: the platform user config directory.
func initDataDir() {
	root := portableRoot()
	portableDataDir := filepath.Join(root, "data")

	switch {
	case isSystemPackage():
		Env.IsSystemPackage = true
		Env.DataDir = xdgDataDir()
		appCacheDir = xdgCacheDir()
		appConfigDir = userConfigDir()
	case !isDirWritable(Env.BasePath):
		Env.DataDir = xdgDataDir()
		appCacheDir = xdgCacheDir()
		appConfigDir = userConfigDir()
	case portableDataDirExists(portableDataDir):
		Env.DataDir = filepath.ToSlash(portableDataDir)
		appCacheDir = ""
		appConfigDir = ""
	default:
		Env.DataDir = xdgDataDir()
		appCacheDir = xdgCacheDir()
		appConfigDir = userConfigDir()
	}

	migrateLegacyConfigs(Env.DataDir, configDir())
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
