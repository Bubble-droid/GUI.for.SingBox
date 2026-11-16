//go:build linux

package storage

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/adrg/xdg"
)

func assertDataDir(t *testing.T, s *Storage, want string) {
	t.Helper()

	t.Logf(
		"basePath=%q xdgDataHome=%q home=%q resolved=%q",
		s.cfg.BasePath,
		os.Getenv("XDG_DATA_HOME"),
		os.Getenv("HOME"),
		s.DataDir(),
	)

	if s.DataDir() != want {
		t.Fatalf("DataDir = %q, want %q", s.DataDir(), want)
	}
}

func assertCacheDir(t *testing.T, s *Storage, want string) {
	t.Helper()

	if s.CacheDir() != want {
		t.Fatalf("CacheDir = %q, want %q", s.CacheDir(), want)
	}
}

func assertConfigDir(t *testing.T, s *Storage, want string) {
	t.Helper()

	if s.ConfigDir() != want {
		t.Fatalf("ConfigDir = %q, want %q", s.ConfigDir(), want)
	}
}

func TestIsSystemPackageBuildFlag(t *testing.T) {
	s := newTestStorage(t.TempDir())

	s.cfg.SystemPackage = "true"
	if !s.isSystemPackageBuild() {
		t.Fatal("SystemPackage=true should report a system package build")
	}
	if !s.isSystemPackage() {
		t.Fatal("SystemPackage=true should drive the directory layout")
	}

	s.cfg.SystemPackage = "false"
	if s.isSystemPackageBuild() {
		t.Fatal("SystemPackage=false should not report a system package build")
	}
	if s.isSystemPackage() {
		t.Fatal("SystemPackage=false should disable system package detection")
	}

	// Unknown keeps the build flag false; the directory layout falls back to
	// the path-based detection, which does not match the test binary.
	s.cfg.SystemPackage = "unknown"
	if s.isSystemPackageBuild() {
		t.Fatal("unknown build flag must not report a system package build")
	}
	if s.isSystemPackage() {
		t.Fatal("path-based fallback should not report a system package for the test binary")
	}
}

func TestIsBinaryDirWritable(t *testing.T) {
	s := newTestStorage(t.TempDir())

	s.cfg.SystemPackage = "unknown"
	if !s.isBinaryDirWritable() {
		t.Fatal("a writable base path outside system prefixes should be updatable")
	}

	s.cfg.SystemPackage = "true"
	if s.isBinaryDirWritable() {
		t.Fatal("the injected package flag must disable in-place updates")
	}

	s.cfg.SystemPackage = "unknown"
	readOnlyBase := t.TempDir()
	if err := os.Chmod(readOnlyBase, 0o555); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		os.Chmod(readOnlyBase, 0o755)
	})
	s.cfg.BasePath = readOnlyBase
	if s.isBinaryDirWritable() {
		t.Fatal("a read-only base path must disable in-place updates")
	}
}

func TestInitDataDirPortable(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	s := newTestStorage(basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data")))

	if s.Paths().IsSystemPackage {
		t.Fatal("portable mode is not a system package install")
	}
	if !s.Paths().IsBinaryDirWritable {
		t.Fatal("portable mode keeps the binary directory writable")
	}

	// Portable mode keeps all paths self-contained under data instead of
	// shunting them to the user's XDG directories.
	assertCacheDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data", ".cache")))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data", "config")))

	gotCache := s.ResolvePath("data/.cache/icons/logo.png")
	wantCache := filepath.ToSlash(filepath.Join(basePath, "data", ".cache", "icons", "logo.png"))
	if gotCache != wantCache {
		t.Fatalf("ResolvePath(data/.cache/...) = %q, want %q", gotCache, wantCache)
	}

	gotConfig := s.ResolvePath("data/config/user.yaml")
	wantConfig := filepath.ToSlash(filepath.Join(basePath, "data", "config", "user.yaml"))
	if gotConfig != wantConfig {
		t.Fatalf("ResolvePath(data/config/...) = %q, want %q", gotConfig, wantConfig)
	}
}

func TestInitDataDirPortableNotWritable(t *testing.T) {
	basePath := t.TempDir()
	portableDataDir := filepath.Join(basePath, "data")
	if err := os.Mkdir(portableDataDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(portableDataDir, 0o555); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		os.Chmod(portableDataDir, 0o755)
	})

	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")
	s := newTestStorage(basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	s.Init()

	// An unwritable portable data directory must fall back to per-user
	// locations instead of failing on the first write.
	assertDataDir(t, s, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertCacheDir(t, s, filepath.ToSlash(filepath.Join(cacheHome, appDirName)))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(configHome, appDirName)))
}

func TestInitDataDirSystemPackageFlagWins(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")
	s := newTestStorage(basePath)
	s.cfg.SystemPackage = "true"
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	s.Init()

	// The injected flag outranks the portable data directory.
	assertDataDir(t, s, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertCacheDir(t, s, filepath.ToSlash(filepath.Join(cacheHome, appDirName)))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(configHome, appDirName)))

	if !s.Paths().IsSystemPackage {
		t.Fatal("the injected flag should be exposed verbatim")
	}
	if s.Paths().IsBinaryDirWritable {
		t.Fatal("a system package install must not be updated in place")
	}
}

func TestInitDataDirPortableUnicodeBasePath(t *testing.T) {
	basePath := filepath.Join(t.TempDir(), "配置 目录 😀")
	if err := os.MkdirAll(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	s := newTestStorage(basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data")))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data", "config")))
}

func TestInitDataDirPortableEmptyDataDir(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	s := newTestStorage(basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data")))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data", "config")))
}

func TestInitDataDirPortableIgnoresNestedContent(t *testing.T) {
	basePath := t.TempDir()
	nested := filepath.Join(basePath, "data", "third", "user.yaml")
	if err := os.MkdirAll(filepath.Dir(nested), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(nested, []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}

	s := newTestStorage(basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	s.Init()

	// Only the data directory itself is probed; its contents do not matter.
	assertDataDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data")))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(basePath, "data", "config")))
}

func TestInitDataDirNotWritable(t *testing.T) {
	basePath := t.TempDir()
	// Make basePath read-only
	if err := os.Chmod(basePath, 0o555); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		os.Chmod(basePath, 0o755)
	})

	s := newTestStorage(basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertCacheDir(t, s, filepath.ToSlash(filepath.Join(cacheHome, appDirName)))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(configHome, appDirName)))

	if s.Paths().IsBinaryDirWritable {
		t.Fatal("a read-only base path must not be updatable in place")
	}
}

func TestInitDataDirXDG(t *testing.T) {
	basePath := t.TempDir()
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")

	s := newTestStorage(basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertCacheDir(t, s, filepath.ToSlash(filepath.Join(cacheHome, appDirName)))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(configHome, appDirName)))
}

func TestInitDataDirXDGFallback(t *testing.T) {
	basePath := t.TempDir()
	homeDir := t.TempDir()

	s := newTestStorage(basePath)
	// Set XDG variables via xdg package directly
	xdg.DataHome = filepath.Join(homeDir, ".local", "share")
	xdg.CacheHome = filepath.Join(homeDir, ".cache")
	xdg.ConfigHome = filepath.Join(homeDir, ".config")

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(homeDir, ".local", "share", appDirName)))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(homeDir, ".config", appDirName)))
}

func TestInitDataDirIgnoresCase(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "DATA"), 0o755); err != nil {
		t.Fatal(err)
	}

	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	s := newTestStorage(basePath)
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(configHome, appDirName)))
}

func TestInitDataDirIgnoresDataFile(t *testing.T) {
	basePath := t.TempDir()
	if err := os.WriteFile(filepath.Join(basePath, "data"), []byte("not a directory"), 0o644); err != nil {
		t.Fatal(err)
	}

	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	s := newTestStorage(basePath)
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(configHome, appDirName)))
}

func TestInitDataDirMigratesLegacyConfigs(t *testing.T) {
	basePath := t.TempDir()
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")

	legacyDir := filepath.Join(dataHome, appDirName)
	if err := os.MkdirAll(legacyDir, 0o755); err != nil {
		t.Fatal(err)
	}
	legacyUser := filepath.Join(legacyDir, "user.yaml")
	if err := os.WriteFile(legacyUser, []byte("width: 900\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	s := newTestStorage(basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	s.Init()

	assertDataDir(t, s, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertConfigDir(t, s, filepath.ToSlash(filepath.Join(configHome, appDirName)))

	migrated := filepath.Join(configHome, appDirName, "user.yaml")
	content, err := os.ReadFile(migrated)
	if err != nil {
		t.Fatalf("read migrated config: %v", err)
	}
	if string(content) != "width: 900\n" {
		t.Fatalf("migrated config content = %q", content)
	}
	if _, err := os.Stat(legacyUser); !os.IsNotExist(err) {
		t.Fatalf("legacy config still exists: %v", err)
	}
}

func TestInitDataDirKeepsExistingConfigDuringMigration(t *testing.T) {
	basePath := t.TempDir()
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")

	legacyDir := filepath.Join(dataHome, appDirName)
	configDir := filepath.Join(configHome, appDirName)
	if err := os.MkdirAll(legacyDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(configDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(legacyDir, "user.yaml"), []byte("width: 900\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(configDir, "user.yaml"), []byte("width: 1200\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	s := newTestStorage(basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	s.Init()

	content, err := os.ReadFile(filepath.Join(configDir, "user.yaml"))
	if err != nil {
		t.Fatalf("read config: %v", err)
	}
	if string(content) != "width: 1200\n" {
		t.Fatalf("existing config was overwritten: %q", content)
	}
}
