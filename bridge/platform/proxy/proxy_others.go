//go:build !windows && !darwin && !linux

package proxy

import "fmt"

func GetSystemProxy() (string, error) {
	return "", fmt.Errorf("unsupported OS")
}

func SetSystemProxy(enabled bool, server string, proxyType string, bypass string, services []string) error {
	return fmt.Errorf("unsupported OS")
}

func SetSystemDNS(servers string, services []string) error {
	return nil
}

func GetSystemProxyBypass() (string, error) {
	return "", fmt.Errorf("unsupported OS")
}
