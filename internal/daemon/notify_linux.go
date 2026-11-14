//go:build linux

package daemon

import (
	"log"
	"os"

	"golang.org/x/sys/unix"
)

// sdNotify sends a single state line to systemd. It is a minimal implementation
// of sd_notify(3) for Type=notify without an external dependency.
func sdNotify(state string) error {
	socket := os.Getenv("NOTIFY_SOCKET")
	if socket == "" {
		return nil
	}

	fd, err := unix.Socket(unix.AF_UNIX, unix.SOCK_DGRAM|unix.SOCK_CLOEXEC, 0)
	if err != nil {
		return err
	}
	defer unix.Close(fd)

	address := &unix.SockaddrUnix{Name: socket}
	if len(socket) > 1 && socket[0] == '@' {
		address.Name = "\x00" + socket[1:]
	}
	return unix.Sendto(fd, []byte(state), 0, address)
}

func NotifyReady() {
	if err := sdNotify("READY=1\nSTATUS=waiting for GUI requests"); err != nil {
		log.Printf("daemon: sd_notify READY: %v", err)
	}
}

func NotifyStopping() {
	if err := sdNotify("STOPPING=1\nSTATUS=stopping"); err != nil {
		log.Printf("daemon: sd_notify STOPPING: %v", err)
	}
}
