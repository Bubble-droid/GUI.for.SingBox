// Package storage resolves the application data, cache and config
// directories and maps logical paths onto them.
package storage

import (
	"errors"
	"fmt"
	"io"
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

// Config carries the values the bridge injects at startup.
type Config struct {
	BasePath      string
	OS            string
	SystemPackage string
	Dev           bool

	// DataDir is an explicit data directory override from the command line.
	// Environment variables and a leading ~ are expanded, relative paths are
	// resolved against the working directory, and an unwritable target falls
	// back to the normal resolution order.
	DataDir string
	// Portable keeps data beside the application. It ranks below the
	// binary-directory writability check, so a read-only installation still
	// uses per-user directories.
	Portable bool
}

// Paths is the resolved directory layout.
type Paths struct {
	DataDir             string
	CacheDir            string
	ConfigDir           string
	IsSystemPackage     bool
	IsBinaryDirWritable bool
}

// Storage resolves logical paths against a directory layout.
type Storage struct {
	cfg   Config
	paths Paths
}

// New creates a storage resolver from the injected configuration. Call Init to
// resolve the layout before using any other method.
func New(cfg Config) *Storage {
	return &Storage{cfg: cfg}
}

// Init resolves the data, cache and config directories for the current
// installation. The resolution order is:
//  1. An explicit data directory was requested and is writable — keep data,
//     config and cache together under it.
//  2. Installed as a system package or the app binary directory is not
//     writable — use per-user directories.
//  3. Portable mode was requested or a portable data directory exists next to
//     the app root, and that directory is writable — stay self-contained: data
//     under root/data, config under data/config and cache under data/.cache.
//  4. Default — use per-user directories.
//
// Platform hooks are supplied by the platform files:
//   - portableRoot: the app root hosting portable data (macOS strips the
//     bundle-internal .app/Contents/MacOS segments; Linux is BasePath).
//   - isSystemPackage: real detection on Linux, always false elsewhere.
//   - isSystemPackageBuild: the injected package flag, reported as-is.
//   - userConfigDir: the platform user config directory.
func (s *Storage) Init() Paths {
	root := portableRoot(s.cfg)
	portableDataDir := filepath.Join(root, "data")
	portableMode := s.cfg.Portable || portableDataDirExists(portableDataDir)
	portableWritable := portableMode && dirWritable(portableDataDir)

	s.paths.IsSystemPackage = s.isSystemPackageBuild()
	s.paths.IsBinaryDirWritable = s.isBinaryDirWritable()

	customDataDir, customOK := s.resolveCustomDataDir()

	switch {
	case customOK:
		s.paths.DataDir = customDataDir
		s.paths.CacheDir = filepath.ToSlash(filepath.Join(customDataDir, ".cache"))
		s.paths.ConfigDir = filepath.ToSlash(filepath.Join(customDataDir, "config"))
	case !s.paths.IsBinaryDirWritable:
		s.paths.DataDir = userDataDir()
		s.paths.CacheDir = userCacheDir()
		s.paths.ConfigDir = userConfigDir(s.paths.DataDir)
	case portableWritable:
		s.paths.DataDir = filepath.ToSlash(portableDataDir)
		s.paths.CacheDir = ""
		s.paths.ConfigDir = ""
	default:
		if portableMode {
			log.Printf("Portable data directory %s is not writable; using per-user directories", MaskUserHome(portableDataDir))
		}
		s.paths.DataDir = userDataDir()
		s.paths.CacheDir = userCacheDir()
		s.paths.ConfigDir = userConfigDir(s.paths.DataDir)
	}

	s.migrateLegacyConfigs(s.paths.DataDir, s.ConfigDir())
	s.EnsureDirs()

	return s.paths
}

// Paths returns the layout resolved by Init.
func (s *Storage) Paths() Paths {
	return s.paths
}

// DataDir returns the resolved data directory.
func (s *Storage) DataDir() string {
	return s.paths.DataDir
}

// CacheDir returns the resolved cache directory, falling back to a
// subdirectory of the data directory when none was resolved.
func (s *Storage) CacheDir() string {
	if s.paths.CacheDir != "" {
		return s.paths.CacheDir
	}
	// Fallback: under the data directory, preserving the old layout.
	return filepath.ToSlash(filepath.Join(s.paths.DataDir, ".cache"))
}

// ConfigDir returns the resolved config directory, falling back to a
// subdirectory of the data directory when none was resolved.
func (s *Storage) ConfigDir() string {
	if s.paths.ConfigDir != "" {
		return s.paths.ConfigDir
	}
	// Fallback: under the data directory, preserving the portable layout.
	return filepath.ToSlash(filepath.Join(s.paths.DataDir, "config"))
}

// ResolvePath maps a logical path onto the resolved directory layout.
func (s *Storage) ResolvePath(path string) string {
	cleanPath := filepath.ToSlash(filepath.Clean(path))

	if filepath.IsAbs(cleanPath) {
		return cleanPath
	}

	if rel, ok := trimLogicalPrefix(cleanPath, cacheLogicalPrefix); ok {
		resolvedPath := filepath.ToSlash(filepath.Join(s.CacheDir(), rel))
		s.logResolvedPath(path, resolvedPath)
		return resolvedPath
	}

	if rel, ok := trimLogicalPrefix(cleanPath, configLogicalPrefix); ok {
		resolvedPath := filepath.ToSlash(filepath.Join(s.ConfigDir(), rel))
		s.logResolvedPath(path, resolvedPath)
		return resolvedPath
	}

	if rel, ok := trimLogicalPrefix(cleanPath, dataLogicalPrefix); ok {
		resolvedPath := filepath.ToSlash(filepath.Join(s.DataDir(), rel))
		s.logResolvedPath(path, resolvedPath)
		return resolvedPath
	}

	resolvedPath := filepath.ToSlash(filepath.Join(s.cfg.BasePath, cleanPath))
	s.logResolvedPath(path, resolvedPath)
	return resolvedPath
}

// EnsureDirs creates the target data, cache and config directories up front;
// later read/write operations (config load, pid lock, embedded extraction)
// rely on their existence.
func (s *Storage) EnsureDirs() {
	if err := os.MkdirAll(s.DataDir(), os.ModePerm); err != nil {
		log.Printf("Failed to create data directory %s: %v", s.DataDir(), err)
	}
	if err := os.MkdirAll(s.CacheDir(), os.ModePerm); err != nil {
		log.Printf("Failed to create cache directory %s: %v", s.CacheDir(), err)
	}
	if err := os.MkdirAll(s.ConfigDir(), os.ModePerm); err != nil {
		log.Printf("Failed to create config directory %s: %v", s.ConfigDir(), err)
	}
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

// userDataDir returns the per-user data directory for the app.
func userDataDir() string {
	return filepath.ToSlash(filepath.Join(xdg.DataHome, appDirName))
}

// userCacheDir returns the per-user cache directory for the app.
func userCacheDir() string {
	return filepath.ToSlash(filepath.Join(xdg.CacheHome, appDirName))
}

// userConfigDir returns the per-user config directory for the app. When no
// XDG config home is available it falls back to the portable layout under the
// resolved data directory.
func userConfigDir(dataDir string) string {
	base := filepath.ToSlash(xdg.ConfigHome)
	if base == "" {
		return filepath.ToSlash(filepath.Join(dataDir, "config"))
	}
	return filepath.ToSlash(filepath.Join(base, appDirName))
}

// isSystemPackageBuild reports whether the binary was built for a system
// package. The injected build variable is the only source of truth for the
// value exposed to the frontend.
func (s *Storage) isSystemPackageBuild() bool {
	return s.cfg.SystemPackage == "true"
}

// resolveCustomDataDir turns the explicit data directory override into an
// absolute, symlink-resolved path. It expands environment variables and a
// leading ~, resolves relative paths against the working directory (not the
// binary location), and reports false when the target cannot be written so the
// caller can fall back.
func (s *Storage) resolveCustomDataDir() (string, bool) {
	raw := strings.TrimSpace(s.cfg.DataDir)
	if raw == "" {
		return "", false
	}

	dir := expandUserPath(raw, s.cfg.OS == "windows")
	if !filepath.IsAbs(dir) {
		workingDir, err := os.Getwd()
		if err != nil {
			log.Printf("Custom data directory %q is relative but the working directory is unavailable: %v", raw, err)
			return "", false
		}
		dir = filepath.Join(workingDir, dir)
	}
	dir = filepath.Clean(dir)

	if !dirWritable(dir) {
		log.Printf("Custom data directory %s is not writable; using the default layout", MaskUserHome(dir))
		return "", false
	}

	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		log.Printf("Failed to create custom data directory %s: %v", MaskUserHome(dir), err)
		return "", false
	}

	if realDir, err := filepath.EvalSymlinks(dir); err == nil {
		dir = realDir
	}

	return filepath.ToSlash(dir), true
}

// expandUserPath expands environment variables and a leading ~ in a user
// supplied path. Windows also accepts the native %VAR% form.
func expandUserPath(value string, windows bool) string {
	expanded := os.ExpandEnv(value)
	if windows {
		expanded = expandPercentEnv(expanded)
	}

	if expanded == "~" || strings.HasPrefix(expanded, "~/") || strings.HasPrefix(expanded, `~\`) {
		if homeDir, err := os.UserHomeDir(); err == nil && homeDir != "" {
			expanded = filepath.Join(homeDir, strings.TrimLeft(expanded[1:], `/\`))
		}
	}

	return expanded
}

// expandPercentEnv replaces Windows-style %NAME% references with their values.
// Unmatched percent signs are left untouched.
func expandPercentEnv(value string) string {
	var b strings.Builder
	for {
		start := strings.IndexByte(value, '%')
		if start < 0 {
			b.WriteString(value)
			return b.String()
		}
		end := strings.IndexByte(value[start+1:], '%')
		if end < 0 {
			b.WriteString(value)
			return b.String()
		}
		b.WriteString(value[:start])
		b.WriteString(os.Getenv(value[start+1 : start+1+end]))
		value = value[start+1+end+1:]
	}
}

// dirWritable reports whether a new entry could be created at target. When the
// target does not exist yet, the nearest existing ancestor is probed instead so
// a rejected override leaves no directories behind.
func dirWritable(target string) bool {
	probe := target

	for {
		info, err := os.Stat(probe)
		if err == nil {
			if !info.IsDir() {
				return false
			}
			break
		}
		if !errors.Is(err, os.ErrNotExist) {
			return false
		}

		parent := filepath.Dir(probe)
		if parent == probe {
			return false
		}
		probe = parent
	}

	file, err := os.CreateTemp(probe, ".write-probe-*")
	if err != nil {
		return false
	}
	name := file.Name()
	_ = file.Close()
	_ = os.Remove(name)

	return true
}

// portableDataDirExists reports whether the portable data directory exists.
// Only the data directory itself is probed, never its contents.
func portableDataDirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

// isBinaryDirWritable reports whether the running binary may be replaced in
// place. It combines the injected package flag, the legacy path detection and
// the actual directory permission.
func (s *Storage) isBinaryDirWritable() bool {
	if s.isSystemPackage() {
		return false
	}
	return dirWritable(s.cfg.BasePath)
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
func (s *Storage) migrateLegacyConfigs(sourceDir string, targetDir string) {
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
		if err := MoveFileAcrossDevices(source, target); err != nil {
			log.Printf("Failed to migrate legacy config %s: %v", MaskUserHome(source), err)
			continue
		}
		log.Printf("Migrated legacy config: %s", MaskUserHome(target))
	}
}

func (s *Storage) logResolvedPath(rawPath string, resolvedPath string) {
	if s.cfg.Dev {
		log.Printf("resolvePath: %q -> %s", rawPath, MaskUserHome(resolvedPath))
	}
}

// MaskUserHome replaces the user's home prefix with ~ so logs never leak the
// absolute home directory.
func MaskUserHome(targetPath string) string {
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

// moveFileAcrossDevices copies a file to another filesystem and removes the
// source, because os.Rename cannot cross device boundaries.
func MoveFileAcrossDevices(src string, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	info, err := srcFile.Stat()
	if err != nil {
		return err
	}

	if info.IsDir() {
		return fmt.Errorf("cannot move directory across devices: %s", src)
	}

	dstFile, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, info.Mode().Perm())
	if err != nil {
		return err
	}

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		dstFile.Close()
		return err
	}

	if err := dstFile.Close(); err != nil {
		return err
	}

	if err := os.Chmod(dst, info.Mode().Perm()); err != nil {
		return err
	}

	return os.Remove(src)
}
