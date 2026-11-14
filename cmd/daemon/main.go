//go:build linux

package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Bubble-droid/GUI.for.SingBox/internal/daemon"
)

func main() {
	var (
		socketPath  string
		stateDir    string
		runtimeDir  string
		group       string
		stableCore  string
		alphaCore   string
		logMaxBytes int64
		logBackups  int
		showVersion bool
	)

	flag.StringVar(&socketPath, "socket", daemon.DefaultSocketPath, "Unix socket path")
	flag.StringVar(&stateDir, "state-dir", daemon.DefaultStateDir, "daemon state directory")
	flag.StringVar(&runtimeDir, "runtime-dir", daemon.DefaultRuntimeDir, "runtime directory")
	flag.StringVar(&group, "group", daemon.DefaultGroup, "trusted group allowed to connect")
	flag.StringVar(&stableCore, "stable-core", daemon.DefaultStableCore, "stable core binary")
	flag.StringVar(&alphaCore, "alpha-core", daemon.DefaultAlphaCore, "alpha core binary")
	flag.Int64Var(&logMaxBytes, "log-max-bytes", 5<<20, "core log rotation size")
	flag.IntVar(&logBackups, "log-backups", 2, "core log rotation backup count")
	flag.BoolVar(&showVersion, "version", false, "print daemon version")
	flag.Parse()

	if showVersion {
		os.Stdout.WriteString(daemon.Version + "\n")
		return
	}

	log.SetFlags(log.LstdFlags | log.LUTC)
	log.SetPrefix("gui-for-singbox-daemon: ")

	if os.Geteuid() != 0 {
		log.Fatal("must run as root")
	}

	authenticator, err := daemon.NewGroupAuthenticator(group)
	if err != nil {
		log.Fatalf("trusted group %q is unavailable: %v", group, err)
	}

	manager, err := daemon.NewManager(daemon.ManagerConfig{
		StateDir:   stateDir,
		RuntimeDir: runtimeDir,
		SocketPath: socketPath,
		StableCore: stableCore,
		AlphaCore:  alphaCore,
		LogMaxSize: logMaxBytes,
		LogBackups: logBackups,
	})
	if err != nil {
		log.Fatalf("initialize manager: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	manager.Recover(ctx)

	listener, activated, err := daemon.ListenSocket(socketPath, runtimeDir, authenticator.GID())
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	log.Printf("version %s listening on %s (activated=%t)", daemon.Version, socketPath, activated)

	daemon.NotifyReady()

	server := daemon.NewServer(listener, manager, authenticator)
	audit := manager.Subscribe()
	go func() {
		for event := range audit.Events() {
			log.Printf("core event: %v", event.Data)
		}
	}()

	serveErr := make(chan error, 1)
	go func() {
		serveErr <- server.Serve()
	}()

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGTERM, syscall.SIGINT)

	select {
	case received := <-signals:
		log.Printf("received %s, shutting down", received)
	case err := <-serveErr:
		if err != nil {
			log.Printf("server stopped: %v", err)
		}
	}

	daemon.NotifyStopping()
	server.Shutdown()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()
	manager.Shutdown(shutdownCtx)
	cancel()
}
