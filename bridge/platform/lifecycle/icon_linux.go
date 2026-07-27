//go:build linux

package lifecycle

import _ "embed"

//go:embed assets/appicon.png
var linuxAppIcon []byte

func GetAppIcon() []byte {
	return linuxAppIcon
}
