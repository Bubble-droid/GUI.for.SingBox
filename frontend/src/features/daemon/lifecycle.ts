import { DaemonReadLog } from '@/bridge/daemon'

const DAEMON_START_TIMEOUT = 30_000
const DAEMON_START_INTERVAL = 500

/**
 * waitForDaemonCoreApi waits until the daemon-started core answers its API.
 * The daemon returns as soon as the child is forked, so startup completion is
 * still observed through the core API.
 */
export const waitForDaemonCoreApi = async (
  probe: () => Promise<boolean>,
  timeout = DAEMON_START_TIMEOUT,
) => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await probe().catch(() => false)) return true
    await new Promise((resolve) => setTimeout(resolve, DAEMON_START_INTERVAL))
  }
  return false
}

/** readDaemonCoreLog returns the tail of the per-user core log. */
export const readDaemonCoreLog = async (tailBytes = 4096) =>
  (await DaemonReadLog(tailBytes)).content
