package cli

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// linuxSystemPrefixes lists directories that are owned by a system package
// manager on Linux. A binary installed there cannot safely replace itself, so
// self-update must be disabled.
var linuxSystemPrefixes = []string{
	"/usr/bin/",
	"/usr/sbin/",
	"/usr/local/bin/",
	"/opt/",
}

// IsLinuxSystemPackage reports whether the running binary was installed by a
// system package manager.
//
// The install location alone is not enough: a user may extract a portable
// tarball into /opt or /usr/local/bin. In that case the directory stays
// writable and an in-place self-update still works, so the binary is treated
// as portable.
func IsLinuxSystemPackage() bool {
	if runtime.GOOS != "linux" {
		return false
	}

	exePath, err := os.Executable()
	if err != nil {
		return false
	}

	if resolved, err := filepath.EvalSymlinks(exePath); err == nil {
		exePath = resolved
	}

	slashed := filepath.ToSlash(exePath)
	managed := false
	for _, prefix := range linuxSystemPrefixes {
		if strings.HasPrefix(slashed, prefix) {
			managed = true
			break
		}
	}

	return managed && !dirIsWritable(filepath.Dir(exePath))
}

// dirIsWritable reports whether the current process can create a file in dir.
func dirIsWritable(dir string) bool {
	f, err := os.CreateTemp(dir, ".write-test-*")
	if err != nil {
		return false
	}

	name := f.Name()
	_ = f.Close()
	_ = os.Remove(name)

	return true
}
