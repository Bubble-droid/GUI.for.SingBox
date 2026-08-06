package proxy

import (
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"

	platform_exec "guiforcores/bridge/platform/exec"
)

func runSystemProxyCommand(path string, args ...string) (string, error) {
	cmd := exec.Command(path, args...)
	platform_exec.SetCmdWindowHidden(cmd)
	cmd.Env = os.Environ()

	out, err := cmd.CombinedOutput()
	output := strings.TrimSpace(string(out))
	if err != nil {
		log.Printf("SystemProxy command failed: %s %v: %v %s", path, args, err, output)
		if output != "" {
			return output, fmt.Errorf("%s %v: %s", path, args, output)
		}
		return output, fmt.Errorf("%s %v: %w", path, args, err)
	}
	return output, nil
}

func runSystemProxyCommands(commands ...[]string) error {
	var wg sync.WaitGroup
	var mu sync.Mutex
	messages := []string{}
	for _, command := range commands {
		wg.Go(func() {
			if _, err := runSystemProxyCommand(command[0], command[1:]...); err != nil {
				mu.Lock()
				messages = append(messages, err.Error())
				mu.Unlock()
			}
		})
	}
	wg.Wait()
	if len(messages) > 0 {
		return errors.New(strings.Join(messages, "; "))
	}
	return nil
}

func splitServer(server string) (string, string) {
	serverName, serverPort, ok := strings.Cut(server, ":")
	if !ok {
		return server, ""
	}
	return serverName, serverPort
}

func splitBypass(bypass string) []string {
	result := []string{}
	for item := range strings.SplitSeq(bypass, ";") {
		item = strings.TrimSpace(item)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}

func splitCommaSeparated(value string) []string {
	result := []string{}
	for item := range strings.SplitSeq(value, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}

func normalizeBypass(bypass string, separator string) string {
	return strings.Join(splitBypass(bypass), separator)
}

func enabledURL(enabled bool, value string, fallback ...string) string {
	if enabled {
		return value
	}
	if len(fallback) > 0 {
		return fallback[0]
	}
	return ""
}

func cleanProxyValue(value string) string {
	return strings.ReplaceAll(strings.Trim(value, "'\"\n\r "), "\n", "")
}

func systemProxyCommandValue(path string, args ...string) (string, error) {
	out, err := runSystemProxyCommand(path, args...)
	if err != nil {
		return "", err
	}
	return cleanProxyValue(out), nil
}
