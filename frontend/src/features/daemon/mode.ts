import { OS } from '@/enums/app'
import { useEnvStore } from '@/stores/env'

/** Daemon core channels mirror the two packaged sing-box binaries. */
export type CoreChannel = 'stable' | 'alpha'

/**
 * isDaemonCoreMode reports whether the root core daemon owns the core.
 * Only Linux system package installs use it. Portable builds keep the setcap
 * and ExecBackground path.
 */
export const isDaemonCoreMode = () => {
  const { env } = useEnvStore()
  return env.os === OS.Linux && env.isSystemPackage
}

/** getCoreChannel maps the GUI branch to the daemon channel name. */
export const getCoreChannel = (isAlpha = false): CoreChannel => (isAlpha ? 'alpha' : 'stable')
