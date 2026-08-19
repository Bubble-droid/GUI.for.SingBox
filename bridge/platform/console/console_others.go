//go:build !windows

package console

func AttachParent() bool { return true }
