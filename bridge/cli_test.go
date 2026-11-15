package bridge

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Bubble-droid/GUI.for.SingBox/internal/info"
)

func TestPrintVersionReportsSystemPackage(t *testing.T) {
	prev := info.Current.SystemPackage
	t.Cleanup(func() {
		info.Current.SystemPackage = prev
	})
	info.Current.SystemPackage = "true"

	var buf bytes.Buffer
	printVersion(&buf)

	if !strings.Contains(buf.String(), "System package : true") {
		t.Fatalf("version output does not report the injected flag:\n%s", buf.String())
	}
}

func TestPrintVersionReportsProgramName(t *testing.T) {
	execPath, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	prog := filepath.Base(execPath)

	var buf bytes.Buffer
	printVersion(&buf)

	if !strings.HasPrefix(buf.String(), prog+" - ") {
		t.Fatalf("version output does not report the executable name %q:\n%s", prog, buf.String())
	}
}
