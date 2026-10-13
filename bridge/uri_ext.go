package bridge

import (
	"net/url"
	"strings"
)

// hasExternalScheme reports whether raw is a URL with a scheme that an OS
// browser should open directly (http, https, mailto, ...). Single-letter
// schemes are treated as Windows drive letters, and "file" is handled
// separately by resolveOpenTarget.
func hasExternalScheme(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}

	if u.Scheme == "" || len(u.Scheme) == 1 {
		return false
	}

	return !strings.EqualFold(u.Scheme, "file")
}

// fileURLToPath converts a file:// URL into a filesystem path, including
// Windows drive letters and UNC hosts.
func fileURLToPath(u *url.URL) string {
	path := u.Path

	if u.Host != "" && !strings.EqualFold(u.Host, "localhost") {
		path = "//" + u.Host + path
	}

	if len(path) >= 3 && path[0] == '/' && path[2] == ':' {
		path = path[1:]
	}

	return path
}

// resolveOpenTarget turns a relative path or file:// URL into a path that
// resolves against the application base directory, and leaves external URLs
// untouched.
func (a *App) resolveOpenTarget(raw string) string {
	u, err := url.Parse(raw)
	if err == nil && strings.EqualFold(u.Scheme, "file") {
		return resolvePath(fileURLToPath(u))
	}

	if hasExternalScheme(raw) {
		return raw
	}

	return resolvePath(raw)
}
