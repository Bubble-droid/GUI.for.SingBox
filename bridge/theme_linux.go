//go:build linux

package bridge

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/godbus/dbus/v5"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	portalName          = "org.freedesktop.portal.Desktop"
	portalPath          = dbus.ObjectPath("/org/freedesktop/portal/desktop")
	portalSettingsIface = "org.freedesktop.portal.Settings"
	appearanceNamespace = "org.freedesktop.appearance"
	systemThemeEvent    = "systemThemeChanged"
)

// GetSystemTheme reads the desktop appearance from the XDG portal. Portals
// unavailable or not implementing the appearance keys yield an unknown mode,
// letting the frontend fall back to prefers-color-scheme.
func (a *App) GetSystemTheme() SystemTheme {
	conn, err := dbus.SessionBus()
	if err != nil {
		log.Printf("GetSystemTheme: session bus unavailable: %v", err)
		return SystemTheme{Mode: "unknown", Source: "none"}
	}
	return readSystemTheme(conn)
}

// StartSystemThemeWatch emits systemThemeChanged whenever the portal reports a
// new appearance setting. The goroutine ends with ctx. It is a package
// function, not an App method, so Wails does not expose it to the frontend.
func StartSystemThemeWatch(ctx context.Context) {
	go func() {
		// A private connection keeps the signal handler from replacing the one
		// on the shared session bus, which other libraries may also use.
		conn, err := dbus.ConnectSessionBus()
		if err != nil {
			log.Printf("StartSystemThemeWatch: session bus unavailable: %v", err)
			return
		}
		defer conn.Close()

		match := []dbus.MatchOption{
			dbus.WithMatchObjectPath(portalPath),
			dbus.WithMatchInterface(portalSettingsIface),
			dbus.WithMatchMember("SettingChanged"),
		}
		if err := conn.AddMatchSignal(match...); err != nil {
			log.Printf("StartSystemThemeWatch: add match: %v", err)
			return
		}
		defer conn.RemoveMatchSignal(match...)

		signals := make(chan *dbus.Signal, 8)
		conn.Signal(signals)
		defer conn.RemoveSignal(signals)

		theme := readSystemTheme(conn)
		for {
			select {
			case <-ctx.Done():
				return
			case signal, ok := <-signals:
				if !ok {
					return
				}
				if !isAppearanceChange(signal) {
					continue
				}
				next := readSystemTheme(conn)
				if next == theme {
					continue
				}
				theme = next
				runtime.EventsEmit(ctx, systemThemeEvent, theme)
			}
		}
	}()
}

func isAppearanceChange(signal *dbus.Signal) bool {
	if signal.Name != portalSettingsIface+".SettingChanged" || len(signal.Body) != 3 {
		return false
	}
	namespace, ok := signal.Body[0].(string)
	if !ok || namespace != appearanceNamespace {
		return false
	}
	_, ok = signal.Body[1].(string)
	return ok
}

func readSystemTheme(conn *dbus.Conn) SystemTheme {
	theme := SystemTheme{Mode: "unknown", Source: "none"}

	if value, err := readPortalSetting(conn, "color-scheme"); err != nil {
		log.Printf("GetSystemTheme: color-scheme: %v", err)
	} else if scheme, ok := value.Value().(uint32); ok {
		switch scheme {
		case 1:
			theme.Mode = "dark"
		case 2:
			theme.Mode = "light"
		}
		if theme.Mode != "unknown" {
			theme.Source = "portal"
		}
	}

	if accent, ok := readPortalAccent(conn); ok {
		theme.Accent = accent
		theme.Source = "portal"
	}

	return theme
}

func readPortalSetting(conn *dbus.Conn, key string) (dbus.Variant, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	obj := conn.Object(portalName, portalPath)
	call := obj.CallWithContext(ctx, portalSettingsIface+".ReadOne", 0, appearanceNamespace, key)
	if call.Err != nil {
		return dbus.Variant{}, call.Err
	}
	var value dbus.Variant
	if err := call.Store(&value); err != nil {
		return dbus.Variant{}, err
	}
	return value, nil
}

func readPortalAccent(conn *dbus.Conn) (string, bool) {
	value, err := readPortalSetting(conn, "accent-color")
	if err != nil {
		log.Printf("GetSystemTheme: accent-color: %v", err)
		return "", false
	}

	var channels []float64
	switch v := value.Value().(type) {
	case []float64:
		channels = v
	case []interface{}:
		for _, item := range v {
			channel, ok := item.(float64)
			if !ok {
				return "", false
			}
			channels = append(channels, channel)
		}
	}
	if len(channels) != 3 {
		return "", false
	}

	return fmt.Sprintf(
		"#%02x%02x%02x",
		colorChannel(channels[0]),
		colorChannel(channels[1]),
		colorChannel(channels[2]),
	), true
}

func colorChannel(value float64) uint8 {
	switch {
	case value <= 0:
		return 0
	case value >= 1:
		return 255
	default:
		return uint8(math.Round(value * 255))
	}
}
