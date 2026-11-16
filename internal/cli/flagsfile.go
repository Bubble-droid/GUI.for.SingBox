package cli

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"unicode"
)

// LaunchFlags are the persistent, user-level overrides stored in the fixed
// flags file. They apply to every normal launch; command-line flags only
// override them for a single run and are never written back.
type LaunchFlags struct {
	DataDir          string
	Portable         bool
	WindowStartState string
}

// WithOverride layers one-shot command-line values on top of the file values.
func (f LaunchFlags) WithOverride(r Result) LaunchFlags {
	if r.DataDir != "" {
		f.DataDir = r.DataDir
	}
	if r.Portable {
		f.Portable = true
	}
	if r.WindowStartState != "" {
		f.WindowStartState = r.WindowStartState
	}
	return f
}

// LoadLaunchFlags reads the flags file at path. A missing file is normal and
// yields no overrides. Invalid lines are logged and skipped so a single typo
// does not discard the remaining flags.
func LoadLaunchFlags(path string) LaunchFlags {
	content, err := os.ReadFile(path)
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			log.Printf("Failed to read launch flags %s: %v", path, err)
		}
		return LaunchFlags{}
	}

	flags, err := ParseLaunchFlags(string(content))
	if err != nil {
		log.Printf("Launch flags %s: %v", path, err)
	}
	return flags
}

// ParseLaunchFlags parses a flag per line. Blank lines and lines starting with
// # are ignored. Both --flag=value and --flag value are accepted; a value may
// contain spaces when it follows the equals sign or the whole line.
func ParseLaunchFlags(content string) (LaunchFlags, error) {
	var flags LaunchFlags
	var errs []error

	content = strings.TrimPrefix(content, "\ufeff")
	for index, raw := range strings.Split(content, "\n") {
		line := strings.TrimSpace(strings.TrimSuffix(raw, "\r"))
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		name, value, hasValue := splitFlagLine(line)
		lineNo := index + 1

		switch name {
		case "data-dir":
			if !hasValue || value == "" {
				errs = append(errs, fmt.Errorf("line %d: --data-dir needs a path", lineNo))
				continue
			}
			flags.DataDir = value
		case "portable":
			if hasValue {
				enabled, err := strconv.ParseBool(value)
				if err != nil {
					errs = append(errs, fmt.Errorf("line %d: invalid --portable value %q", lineNo, value))
					continue
				}
				flags.Portable = enabled
				continue
			}
			flags.Portable = true
		case "window-start-state":
			state := strings.ToLower(value)
			if state != "normal" && state != "minimised" {
				errs = append(errs, fmt.Errorf("line %d: invalid --window-start-state %q (want normal or minimised)", lineNo, value))
				continue
			}
			flags.WindowStartState = state
		default:
			errs = append(errs, fmt.Errorf("line %d: unknown flag %q", lineNo, name))
		}
	}

	return flags, errors.Join(errs...)
}

// splitFlagLine splits one flags-file line into its name and optional value.
func splitFlagLine(line string) (name string, value string, hasValue bool) {
	line = strings.TrimLeft(line, "-")
	if idx := strings.IndexByte(line, '='); idx >= 0 {
		return strings.TrimSpace(line[:idx]), strings.TrimSpace(line[idx+1:]), true
	}
	if idx := strings.IndexFunc(line, unicode.IsSpace); idx >= 0 {
		return line[:idx], strings.TrimSpace(line[idx:]), true
	}
	return line, "", false
}
