//go:build !linux

package lifecycle

func GetAppIcon() []byte {
	return nil
}
