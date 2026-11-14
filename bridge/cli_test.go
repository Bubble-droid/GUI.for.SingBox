package bridge

import (
	"bytes"
	"strings"
	"testing"
)

func TestPrintVersionReportsSystemPackage(t *testing.T) {
	prev := SystemPackage
	t.Cleanup(func() {
		SystemPackage = prev
	})

	SystemPackage = "true"

	var buf bytes.Buffer
	printVersion(&buf)

	if !strings.Contains(buf.String(), "System package : true") {
		t.Fatalf("version output does not report the injected flag:\n%s", buf.String())
	}
}
