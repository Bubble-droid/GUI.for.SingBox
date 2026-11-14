//go:build linux

package bridge

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/adrg/xdg"
)

func assertDataDir(t *testing.T, want string) {
	t.Helper()

	t.Logf(
		"basePath=%q xdgDataHome=%q home=%q resolved=%q",
		Env.BasePath,
		os.Getenv("XDG_DATA_HOME"),
		os.Getenv("HOME"),
		Env.DataDir,
	)

	if Env.DataDir != want {
		t.Fatalf("DataDir = %q, want %q", Env.DataDir, want)
	}
}

func assertCacheDir(t *testing.T, want string) {
	t.Helper()

	if appCacheDir != want {
		t.Fatalf("appCacheDir = %q, want %q", appCacheDir, want)
	}
}

func assertConfigDir(t *testing.T, want string) {
	t.Helper()

	if appConfigDir != want {
		t.Fatalf("appConfigDir = %q, want %q", appConfigDir, want)
	}
}

func TestIsSystemPackageBuildFlag(t *testing.T) {
	prev := SystemPackage
	t.Cleanup(func() {
		SystemPackage = prev
	})

	SystemPackage = "true"
	if !isSystemPackage() {
		t.Fatal("SystemPackage=true should report a system package build")
	}

	SystemPackage = "false"
	if isSystemPackage() {
		t.Fatal("SystemPackage=false should disable system package detection")
	}

	// Unknown falls back to the path-based detection; the test binary does not
	// live under a system package prefix.
	SystemPackage = unknown
	if isSystemPackage() {
		t.Fatal("path-based fallback should not report a system package for the test binary")
	}
}

func TestInitDataDirPortable(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	setTestEnv(t, basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(basePath, "data")))

	// Portable mode keeps all paths self-contained under data instead of
	// shunting them to the user's XDG directories.
	assertCacheDir(t, "")
	assertConfigDir(t, "")

	gotCache := resolvePath("data/.cache/icons/logo.png")
	wantCache := filepath.ToSlash(filepath.Join(basePath, "data", ".cache", "icons", "logo.png"))
	if gotCache != wantCache {
		t.Fatalf("resolvePath(data/.cache/...) = %q, want %q", gotCache, wantCache)
	}

	gotConfig := resolvePath("data/config/user.yaml")
	wantConfig := filepath.ToSlash(filepath.Join(basePath, "data", "config", "user.yaml"))
	if gotConfig != wantConfig {
		t.Fatalf("resolvePath(data/config/...) = %q, want %q", gotConfig, wantConfig)
	}
}

func TestInitDataDirSystemPackageFlagWins(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	prev := SystemPackage
	t.Cleanup(func() {
		SystemPackage = prev
	})
	SystemPackage = "true"

	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")
	setTestEnv(t, basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	initDataDir()

	// The injected flag outranks the portable data directory.
	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertCacheDir(t, filepath.ToSlash(filepath.Join(cacheHome, appDirName)))
	assertConfigDir(t, filepath.ToSlash(filepath.Join(configHome, appDirName)))
}

func TestInitDataDirPortableUnicodeBasePath(t *testing.T) {
	basePath := filepath.Join(t.TempDir(), "配置 目录 😀")
	if err := os.MkdirAll(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	setTestEnv(t, basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(basePath, "data")))
	assertConfigDir(t, "")
}

func TestInitDataDirPortableEmptyDataDir(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	setTestEnv(t, basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(basePath, "data")))
	assertConfigDir(t, "")
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

	setTestEnv(t, basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	initDataDir()

	// Only the data directory itself is probed; its contents do not matter.
	assertDataDir(t, filepath.ToSlash(filepath.Join(basePath, "data")))
	assertConfigDir(t, "")
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

	setTestEnv(t, basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertCacheDir(t, filepath.ToSlash(filepath.Join(cacheHome, appDirName)))
	assertConfigDir(t, filepath.ToSlash(filepath.Join(configHome, appDirName)))
}

func TestInitDataDirXDG(t *testing.T) {
	basePath := t.TempDir()
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	configHome := filepath.Join(t.TempDir(), "config")

	setTestEnv(t, basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertCacheDir(t, filepath.ToSlash(filepath.Join(cacheHome, appDirName)))
	assertConfigDir(t, filepath.ToSlash(filepath.Join(configHome, appDirName)))
}

func TestInitDataDirXDGFallback(t *testing.T) {
	basePath := t.TempDir()
	homeDir := t.TempDir()

	setTestEnv(t, basePath)
	// Set XDG variables via xdg package directly
	xdg.DataHome = filepath.Join(homeDir, ".local", "share")
	xdg.CacheHome = filepath.Join(homeDir, ".cache")
	xdg.ConfigHome = filepath.Join(homeDir, ".config")

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(homeDir, ".local", "share", appDirName)))
	assertConfigDir(t, filepath.ToSlash(filepath.Join(homeDir, ".config", appDirName)))
}

func TestInitDataDirIgnoresCase(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "DATA"), 0o755); err != nil {
		t.Fatal(err)
	}

	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	setTestEnv(t, basePath)
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertConfigDir(t, filepath.ToSlash(filepath.Join(configHome, appDirName)))
}

func TestInitDataDirIgnoresDataFile(t *testing.T) {
	basePath := t.TempDir()
	if err := os.WriteFile(filepath.Join(basePath, "data"), []byte("not a directory"), 0o644); err != nil {
		t.Fatal(err)
	}

	dataHome := filepath.Join(t.TempDir(), "xdg")
	configHome := filepath.Join(t.TempDir(), "config")
	setTestEnv(t, basePath)
	xdg.DataHome = dataHome
	xdg.ConfigHome = configHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertConfigDir(t, filepath.ToSlash(filepath.Join(configHome, appDirName)))
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

	setTestEnv(t, basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
	assertConfigDir(t, filepath.ToSlash(filepath.Join(configHome, appDirName)))

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

	setTestEnv(t, basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome
	xdg.ConfigHome = configHome

	initDataDir()

	content, err := os.ReadFile(filepath.Join(configDir, "user.yaml"))
	if err != nil {
		t.Fatalf("read config: %v", err)
	}
	if string(content) != "width: 1200\n" {
		t.Fatalf("existing config was overwritten: %q", content)
	}
}
