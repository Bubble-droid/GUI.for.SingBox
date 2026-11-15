import { DaemonInfo } from '@/bridge/daemon'
import type { DaemonChannel } from '@/bridge/daemon'

import type { CoreChannel } from './mode'

/** readDaemonCoreChannel returns the packaged channel metadata. */
export const readDaemonCoreChannel = async (
  channel: CoreChannel,
): Promise<DaemonChannel | undefined> => {
  const info = await DaemonInfo()
  return info.channels.find((item) => item.name === channel)
}

/** readDaemonVersion returns the version of the daemon answering the socket. */
export const readDaemonVersion = async () => (await DaemonInfo()).version || ''

/** readDaemonCoreVersion returns the packaged core version text. */
export const readDaemonCoreVersion = async (channel: CoreChannel) =>
  (await readDaemonCoreChannel(channel))?.version || ''

/** daemonCoreDirectory returns the directory that contains the packaged core. */
export const daemonCoreDirectory = async (channel: CoreChannel) => {
  const path = (await readDaemonCoreChannel(channel))?.path || ''
  const index = path.lastIndexOf('/')
  return index > 0 ? path.slice(0, index) : path
}
