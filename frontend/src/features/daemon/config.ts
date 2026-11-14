import { DaemonApplyConfig, DaemonGetConfig } from '@/bridge/daemon'

import { Branch } from '@/enums/app'
import { useAppSettingsStore } from '@/stores/appSettings'

import { getCoreChannel } from './mode'

/** currentDaemonChannel follows the configured kernel branch. */
export const currentDaemonChannel = () =>
  getCoreChannel(useAppSettingsStore().app.kernel.branch === Branch.Alpha)

/**
 * applyDaemonCoreConfig submits the generated configuration to the daemon.
 * The daemon validates it with the packaged core and commits it atomically.
 */
export const applyDaemonCoreConfig = (config: unknown, channel = currentDaemonChannel()) =>
  DaemonApplyConfig(channel, JSON.stringify(config))

/** readDaemonCoreConfig returns the configuration committed for this user. */
export const readDaemonCoreConfig = async () => (await DaemonGetConfig()).config
