package cli

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParseLaunchFlags(t *testing.T) {
	content := "\ufeff# persistent launch flags\n\n" +
		"--data-dir=~/GUI.for.SingBox data\n" +
		"--portable\n" +
		"  --window-start-state Minimised  \r\n" +
		"# --data-dir=/ignored\n"

	flags, err := ParseLaunchFlags(content)
	if err != nil {
		t.Fatalf("ParseLaunchFlags returned an error: %v", err)
	}

	if flags.DataDir != "~/GUI.for.SingBox data" {
		t.Fatalf("DataDir = %q, want %q", flags.DataDir, "~/GUI.for.SingBox data")
	}
	if !flags.Portable {
		t.Fatal("Portable should be enabled")
	}
	if flags.WindowStartState != "minimised" {
		t.Fatalf("WindowStartState = %q, want %q", flags.WindowStartState, "minimised")
	}
}

func TestParseLaunchFlagsSpaceForm(t *testing.T) {
	flags, err := ParseLaunchFlags("--data-dir /tmp/data dir\n--window-start-state normal\n")
	if err != nil {
		t.Fatalf("ParseLaunchFlags returned an error: %v", err)
	}
	if flags.DataDir != "/tmp/data dir" {
		t.Fatalf("DataDir = %q, want %q", flags.DataDir, "/tmp/data dir")
	}
	if flags.WindowStartState != "normal" {
		t.Fatalf("WindowStartState = %q, want %q", flags.WindowStartState, "normal")
	}
}

func TestParseLaunchFlagsPortableValue(t *testing.T) {
	flags, err := ParseLaunchFlags("--portable=false\n")
	if err != nil {
		t.Fatalf("ParseLaunchFlags returned an error: %v", err)
	}
	if flags.Portable {
		t.Fatal("Portable should be disabled")
	}
}

func TestParseLaunchFlagsKeepsValidLinesOnError(t *testing.T) {
	flags, err := ParseLaunchFlags("--data-dir=/tmp/data\n--unknown\n--window-start-state=sideways\n--portable\n")
	if err == nil {
		t.Fatal("ParseLaunchFlags should report invalid lines")
	}
	if flags.DataDir != "/tmp/data" {
		t.Fatalf("DataDir = %q, want %q", flags.DataDir, "/tmp/data")
	}
	if !flags.Portable {
		t.Fatal("valid lines after an invalid line should still apply")
	}
	if flags.WindowStartState != "" {
		t.Fatalf("WindowStartState = %q, want empty", flags.WindowStartState)
	}
}

func TestParseLaunchFlagsEmptyDataDir(t *testing.T) {
	if _, err := ParseLaunchFlags("--data-dir=\n"); err == nil {
		t.Fatal("an empty --data-dir value should be rejected")
	}
	if _, err := ParseLaunchFlags("--data-dir\n"); err == nil {
		t.Fatal("--data-dir without a value should be rejected")
	}
}

func TestLaunchFlagsWithOverride(t *testing.T) {
	file := LaunchFlags{DataDir: "/from/file", WindowStartState: "normal"}

	merged := file.WithOverride(Result{})
	if merged != file {
		t.Fatalf("empty overrides changed the file flags: %#v", merged)
	}

	merged = file.WithOverride(Result{
		DataDir:          "/from/cli",
		Portable:         true,
		WindowStartState: "minimised",
	})
	if merged.DataDir != "/from/cli" {
		t.Fatalf("DataDir = %q, want %q", merged.DataDir, "/from/cli")
	}
	if !merged.Portable {
		t.Fatal("Portable should be enabled by the command line")
	}
	if merged.WindowStartState != "minimised" {
		t.Fatalf("WindowStartState = %q, want %q", merged.WindowStartState, "minimised")
	}
}

func TestLoadLaunchFlagsMissingFile(t *testing.T) {
	flags := LoadLaunchFlags(filepath.Join(t.TempDir(), "missing.conf"))
	if flags != (LaunchFlags{}) {
		t.Fatalf("missing file should yield empty flags, got %#v", flags)
	}
}

func TestLoadLaunchFlagsFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "flags.conf")
	if err := os.WriteFile(path, []byte("--data-dir=/tmp/from-file\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	flags := LoadLaunchFlags(path)
	if flags.DataDir != "/tmp/from-file" {
		t.Fatalf("DataDir = %q, want %q", flags.DataDir, "/tmp/from-file")
	}
}
