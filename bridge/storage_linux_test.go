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

func writeDataFile(t *testing.T, basePath, rel string) {
	t.Helper()

	path := filepath.Join(basePath, "data", rel)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestInitDataDirPortable(t *testing.T) {
	basePath := t.TempDir()
	writeDataFile(t, basePath, "user.yaml")

	setTestEnv(t, basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(basePath, "data")))

	// Portable mode keeps the cache self-contained under data/.cache instead
	// of shunting it to the user's XDG cache home.
	if appCacheDir != "" {
		t.Fatalf("portable appCacheDir = %q, want empty (fall back to dataDir/.cache)", appCacheDir)
	}

	gotCache := resolvePath("data/.cache/icons/logo.png")
	wantCache := filepath.ToSlash(filepath.Join(basePath, "data", ".cache", "icons", "logo.png"))
	if gotCache != wantCache {
		t.Fatalf("resolvePath(data/.cache/...) = %q, want %q", gotCache, wantCache)
	}
}

func TestInitDataDirPortableUnicodeBasePath(t *testing.T) {
	basePath := filepath.Join(t.TempDir(), "配置 目录 😀")
	if err := os.MkdirAll(basePath, 0o755); err != nil {
		t.Fatal(err)
	}
	writeDataFile(t, basePath, "user.yaml")

	setTestEnv(t, basePath)
	dataHome := filepath.Join(t.TempDir(), "xdg")
	xdg.DataHome = dataHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(basePath, "data")))
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
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))

	wantCache := filepath.ToSlash(filepath.Join(cacheHome, appDirName))
	if appCacheDir != wantCache {
		t.Fatalf("appCacheDir = %q, want %q", appCacheDir, wantCache)
	}
}

func TestInitDataDirXDG(t *testing.T) {
	basePath := t.TempDir()
	dataHome := filepath.Join(t.TempDir(), "xdg")
	cacheHome := filepath.Join(t.TempDir(), "cache")

	setTestEnv(t, basePath)
	xdg.DataHome = dataHome
	xdg.CacheHome = cacheHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))

	wantCache := filepath.ToSlash(filepath.Join(cacheHome, appDirName))
	if appCacheDir != wantCache {
		t.Fatalf("appCacheDir = %q, want %q", appCacheDir, wantCache)
	}
}

func TestInitDataDirXDGFallback(t *testing.T) {
	basePath := t.TempDir()
	homeDir := t.TempDir()

	setTestEnv(t, basePath)
	// Set XDG variables via xdg package directly
	xdg.DataHome = filepath.Join(homeDir, ".local", "share")
	xdg.CacheHome = filepath.Join(homeDir, ".cache")

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(homeDir, ".local", "share", appDirName)))
}

func TestInitDataDirIgnoresNestedMarker(t *testing.T) {
	basePath := t.TempDir()
	writeDataFile(t, basePath, filepath.Join("third", "user.yaml"))

	dataHome := filepath.Join(t.TempDir(), "xdg")
	setTestEnv(t, basePath)
	xdg.DataHome = dataHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
}

func TestInitDataDirIgnoresCase(t *testing.T) {
	basePath := t.TempDir()
	writeDataFile(t, basePath, "USER.YAML")

	dataHome := filepath.Join(t.TempDir(), "xdg")
	setTestEnv(t, basePath)
	xdg.DataHome = dataHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
}

func TestInitDataDirIgnoresEmptyDataDir(t *testing.T) {
	basePath := t.TempDir()
	if err := os.Mkdir(filepath.Join(basePath, "data"), 0o755); err != nil {
		t.Fatal(err)
	}

	dataHome := filepath.Join(t.TempDir(), "xdg")
	setTestEnv(t, basePath)
	xdg.DataHome = dataHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
}

func TestInitDataDirIgnoresDataFile(t *testing.T) {
	basePath := t.TempDir()
	if err := os.WriteFile(filepath.Join(basePath, "data"), []byte("not a directory"), 0o644); err != nil {
		t.Fatal(err)
	}

	dataHome := filepath.Join(t.TempDir(), "xdg")
	setTestEnv(t, basePath)
	xdg.DataHome = dataHome

	initDataDir()

	assertDataDir(t, filepath.ToSlash(filepath.Join(dataHome, appDirName)))
}
