package lifecycle

import "log"

func LogLinuxPackageInfo(isSystemPackage bool, isBundled bool, singBoxVersion string, singBoxAlphaVersion string) {
	log.Printf("Install as a System Package: %t", isSystemPackage)
	log.Printf("Bundled Package: %t", isBundled)
	if isBundled {
		log.Printf("Bundled Sing-Box Core (Stable): v%s", singBoxVersion)
		log.Printf("Bundled Sing-Box Core (Alpha) : v%s", singBoxAlphaVersion)
	}
}
