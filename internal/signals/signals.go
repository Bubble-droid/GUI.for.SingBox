package signals

import (
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"guiforcores/bridge"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	exitSignalTimeout = 15 * time.Second
	forceExitGrace    = 3 * time.Second
)

// exitSignals are the POSIX termination signals that should trigger a
// graceful frontend shutdown.
var exitSignals = []os.Signal{
	os.Interrupt,    // SIGINT: Ctrl+C or kill -2
	syscall.SIGTERM, // SIGTERM: standard kill
	syscall.SIGQUIT, // SIGQUIT: Ctrl+\
	syscall.SIGHUP,  // SIGHUP: controlling terminal disconnected
}

// Handler manages cross-platform exit signals and lifecycle.
type Handler struct {
	app       *bridge.App
	sigChan   chan os.Signal
	readyChan chan struct{}
	readyOnce sync.Once
	closeOnce sync.Once
	cleanup   func()
}

// Setup initializes the signal listener.
func Setup(a *bridge.App) *Handler {
	h := &Handler{
		app:       a,
		sigChan:   make(chan os.Signal, 10), // buffered so signals are not lost
		readyChan: make(chan struct{}),
	}

	signal.Notify(h.sigChan, exitSignals...)

	go h.watch()

	return h
}

func (h *Handler) watch() {
	// 1. Wait for the first exit trigger.
	sig := <-h.sigChan
	log.Printf("Signals: Received OS signal: %v", sig)

	// 2. Exit immediately when the frontend has not loaded yet.
	select {
	case <-h.readyChan:
		runtime.EventsEmit(h.app.Ctx, "onExitApp")
	default:
		log.Printf("Signals: Exit requested before frontend ready, exiting immediately")
		h.Close()
		os.Exit(0)
	}

	// 3. Wait for the frontend to finish. A second signal or the timeout
	// forces the exit.
	select {
	case sig := <-h.sigChan:
		log.Printf("Signals: Received OS signal again (%v), forcing exit", sig)
		h.Close()
		os.Exit(1)
	case <-time.After(exitSignalTimeout):
		log.Printf("Signals: Frontend exit timed out (%v), invoking backend ExitApp", exitSignalTimeout)
		h.app.ExitApp()
	}

	// 4. Give ExitApp a short grace period to clean up.
	select {
	case <-h.sigChan:
	case <-time.After(forceExitGrace):
	}

	h.Close()
	os.Exit(1)
}

// Ready is called from OnDomReady once the frontend DOM is ready.
func (h *Handler) Ready() {
	h.readyOnce.Do(func() {
		// Stop the terminal from broadcasting Ctrl+C/Ctrl+\ to WebKit, then
		// take over from Wails' internal signal handler.
		h.cleanup = setupTerminalInterrupt()
		signal.Reset(exitSignals...)
		signal.Notify(h.sigChan, exitSignals...)

		close(h.readyChan)
	})
}

// Close restores signal handling and unregisters the listener (idempotent).
func (h *Handler) Close() {
	h.closeOnce.Do(func() {
		signal.Stop(h.sigChan)
		if h.cleanup != nil {
			h.cleanup()
		}
	})
}
