//go:build !windows

package icon

import _ "embed"

//go:embed assets/appicon.png
var AppIcon []byte
