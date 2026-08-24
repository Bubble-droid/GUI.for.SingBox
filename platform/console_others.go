//go:build !windows

package platform

func AttachParent() bool { return true }
