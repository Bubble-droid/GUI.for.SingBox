package cli

import (
	"bytes"
	"io"
	"strings"
	"testing"
)

func TestParseEmptyArgs(t *testing.T) {
	res := Parse(nil, io.Discard, io.Discard)

	if res.Action != ActionLaunch {
		t.Fatalf("Action = %v, want ActionLaunch", res.Action)
	}
	if res.ExitCode != 0 {
		t.Fatalf("ExitCode = %d, want 0", res.ExitCode)
	}
}

func TestParseSubcommands(t *testing.T) {
	tests := []struct {
		name        string
		args        []string
		wantAction  Action
		wantTaskSch bool
		wantOutput  string
	}{
		{name: "help", args: []string{"help"}, wantAction: ActionExit, wantOutput: "Usage:"},
		{name: "flag help", args: []string{"--help"}, wantAction: ActionExit, wantOutput: "Usage:"},
		{name: "short help", args: []string{"-h"}, wantAction: ActionExit, wantOutput: "Usage:"},
		{name: "version", args: []string{"version"}, wantAction: ActionExit, wantOutput: "Git version"},
		{name: "flag version", args: []string{"--version"}, wantAction: ActionExit, wantOutput: "Git version"},
		{name: "quit", args: []string{"quit"}, wantAction: ActionQuit},
		{name: "flag quit", args: []string{"--quit"}, wantAction: ActionQuit},
		{name: "tasksch", args: []string{"tasksch"}, wantAction: ActionLaunch, wantTaskSch: true},
		{name: "flag tasksch", args: []string{"-t"}, wantAction: ActionLaunch, wantTaskSch: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var stdout, stderr bytes.Buffer

			res := Parse(tt.args, &stdout, &stderr)

			if res.Action != tt.wantAction {
				t.Fatalf("Action = %v, want %v", res.Action, tt.wantAction)
			}
			if res.FromTaskSch != tt.wantTaskSch {
				t.Fatalf("FromTaskSch = %v, want %v", res.FromTaskSch, tt.wantTaskSch)
			}
			if tt.wantOutput != "" && !strings.Contains(stdout.String(), tt.wantOutput) {
				t.Fatalf("stdout = %q, want it to contain %q", stdout.String(), tt.wantOutput)
			}
			if stderr.Len() != 0 {
				t.Fatalf("stderr = %q, want empty", stderr.String())
			}
		})
	}
}

func TestParseIgnoresUnknownFlags(t *testing.T) {
	var stdout, stderr bytes.Buffer

	// macOS and Wails pass their own arguments; they must not block startup.
	res := Parse([]string{"-psn_0_1234", "--unknown=1", "extra", "--version"}, &stdout, &stderr)

	if res.Action != ActionExit {
		t.Fatalf("Action = %v, want ActionExit", res.Action)
	}
	if res.ExitCode != 0 {
		t.Fatalf("ExitCode = %d, want 0", res.ExitCode)
	}
	if !strings.Contains(stdout.String(), "Git version") {
		t.Fatalf("stdout = %q, want version output", stdout.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestParseUnknownFlagsOnlyLaunches(t *testing.T) {
	res := Parse([]string{"-psn_0_1234", "--unknown"}, io.Discard, io.Discard)

	if res.Action != ActionLaunch {
		t.Fatalf("Action = %v, want ActionLaunch", res.Action)
	}
}

func TestParseDoubleDashStopsParsing(t *testing.T) {
	res := Parse([]string{"--", "--version"}, io.Discard, io.Discard)

	if res.Action != ActionLaunch {
		t.Fatalf("Action = %v, want ActionLaunch", res.Action)
	}
}

func TestParseInvalidKnownFlagValue(t *testing.T) {
	var stdout, stderr bytes.Buffer

	res := Parse([]string{"--version=maybe"}, &stdout, &stderr)

	if res.Action != ActionExit {
		t.Fatalf("Action = %v, want ActionExit", res.Action)
	}
	if res.ExitCode != 2 {
		t.Fatalf("ExitCode = %d, want 2", res.ExitCode)
	}
	if !strings.Contains(stderr.String(), "invalid boolean value") {
		t.Fatalf("stderr = %q, want invalid boolean value message", stderr.String())
	}
}

func TestIsQuit(t *testing.T) {
	tests := []struct {
		args []string
		want bool
	}{
		{nil, false},
		{[]string{"--quit"}, true},
		{[]string{"-q"}, true},
		{[]string{"--unknown", "quit"}, true},
		{[]string{"--version"}, false},
	}

	for _, tt := range tests {
		if got := IsQuit(tt.args); got != tt.want {
			t.Fatalf("IsQuit(%v) = %v, want %v", tt.args, got, tt.want)
		}
	}
}
