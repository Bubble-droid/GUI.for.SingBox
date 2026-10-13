package bridge

import (
	"net/url"
	"testing"
)

func TestHasExternalScheme(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want bool
	}{
		{"empty", "", false},
		{"relative path", "data/sing-box/config.json", false},
		{"absolute posix path", "/tmp/file.txt", false},
		{"windows drive letter", `C:\Users\file.txt`, false},
		{"http", "http://example.com/a", true},
		{"https", "https://example.com/a", true},
		{"mailto", "mailto:someone@example.com", true},
		{"file scheme", "file:///tmp/file.txt", false},
		{"FILE scheme", "FILE:///tmp/file.txt", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := hasExternalScheme(tt.raw); got != tt.want {
				t.Fatalf("hasExternalScheme(%q) = %v, want %v", tt.raw, got, tt.want)
			}
		})
	}
}

func TestFileURLToPath(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want string
	}{
		{"posix", "file:///tmp/file.txt", "/tmp/file.txt"},
		{"localhost", "file://localhost/tmp/file.txt", "/tmp/file.txt"},
		{"escaped space", "file:///tmp/a%20b.txt", "/tmp/a b.txt"},
		{"windows drive", "file:///C:/Users/file.txt", "C:/Users/file.txt"},
		{"unc host", "file://server/share/file.txt", "//server/share/file.txt"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u, err := url.Parse(tt.raw)
			if err != nil {
				t.Fatalf("url.Parse(%q): %v", tt.raw, err)
			}
			if got := fileURLToPath(u); got != tt.want {
				t.Fatalf("fileURLToPath(%q) = %q, want %q", tt.raw, got, tt.want)
			}
		})
	}
}
