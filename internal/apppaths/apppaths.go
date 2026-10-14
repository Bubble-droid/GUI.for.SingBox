package apppaths

import (
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"guiforcores/internal/appinfo"
)

type Paths struct {
	AppDataPath   string
	AppConfigPath string
	AppCachePath  string
	BasePath      string
}

// EnsureDirs creates the data, config and cache directories if missing.
func (p *Paths) EnsureDirs() error {
	for _, dir := range []string{p.AppDataPath, p.AppConfigPath, p.AppCachePath} {
		if dir == "" {
			continue
		}
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
	}
	return nil
}

var (
	defaultMu    sync.Mutex
	defaultPaths *Paths
)

// SetDefault installs the process-wide resolver used by ResolvePath. Passing
// nil clears it so the next ResolvePath builds one from its base path.
func SetDefault(p *Paths) {
	defaultMu.Lock()
	defer defaultMu.Unlock()
	defaultPaths = p
}

func defaultResolver(basePath string) *Paths {
	defaultMu.Lock()
	defer defaultMu.Unlock()

	if defaultPaths == nil {
		defaultPaths = New(basePath)
	}

	return defaultPaths
}

// ResolvePath maps a bridge-relative path to its absolute location. Absolute
// paths are only normalized; everything else is delegated to the registered
// resolver, which falls back to basePath when none has been installed yet.
func ResolvePath(rawPath, basePath string) string {
	cleanPath := filepath.Clean(rawPath)

	resolvedPath := defaultResolver(basePath).Resolve(cleanPath)
	if appinfo.Current.IsDev {
		log.Printf("Real Path: %s", MaskUserHome(resolvedPath))
	}

	return resolvedPath
}

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
