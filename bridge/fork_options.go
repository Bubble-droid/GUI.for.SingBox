package bridge

import (
	"time"

	"guiforcores/internal/appinfo"

	"github.com/wailsapp/wails/v2/pkg/options"
)

// ApplyForkOptions overrides upstream defaults with fork-specific application
// metadata.
//
// Keeping this in the bridge package means main.go needs no fork-only import,
// so its diff against upstream stays minimal.
func ApplyForkOptions(o *options.App) {
	o.Title = appinfo.Current.Title

	if o.Mac != nil && o.Mac.About != nil {
		o.Mac.About.Title = appinfo.Current.Title
	}

	if o.Linux != nil {
		o.Linux.ProgramName = appinfo.Current.ID
	}

	if o.SingleInstanceLock != nil {
		if Config.MultipleInstance {
			o.SingleInstanceLock.UniqueId = time.Now().String()
		} else {
			o.SingleInstanceLock.UniqueId = appinfo.Current.ID
		}
	}
}
