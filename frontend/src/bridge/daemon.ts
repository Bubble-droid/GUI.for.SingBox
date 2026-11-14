import * as Bridge from '@wails/go/bridge/App'
import { EventsOn } from '@wails/runtime/runtime'

export interface DaemonChannel {
  name: string
  path: string
  version: string
}

export interface DaemonInfo {
  version: string
  socket: string
  channels: DaemonChannel[]
}

export interface DaemonCoreStatus {
  state: 'stopped' | 'starting' | 'running' | 'stopping' | 'failed'
  channel: string
  pid: number
  ownerUid: number
  startedAt: number
  lastError: string
  configSha256: string
}

export interface DaemonConfigureResult {
  sha256: string
  bytes: number
}

export interface DaemonConfig {
  config: string
  sha256: string
}

export interface DaemonLog {
  content: string
  truncated: boolean
}

export interface DaemonError {
  code: number
  message: string
  data?: unknown
}

export enum DaemonErrorCode {
  Unauthorized = -32001,
  Unavailable = -32002,
  ConfigInvalid = -32003,
  Busy = -32004,
  InvalidState = -32005,
  InvalidParams = -32006,
  Internal = -32007,
}

const parseError = (data: string): DaemonError | string => {
  try {
    const parsed = JSON.parse(data)
    if (parsed && typeof parsed.code === 'number' && typeof parsed.message === 'string') {
      return parsed as DaemonError
    }
  } catch {
    // Not a structured daemon error.
  }
  return data
}

const unwrap = <T>(result: { flag: boolean; data: string }): T => {
  if (!result.flag) {
    throw parseError(result.data)
  }
  return JSON.parse(result.data) as T
}

export const DaemonInfo = async () => unwrap<DaemonInfo>(await Bridge.DaemonInfo())

export const DaemonStatus = async () => unwrap<DaemonCoreStatus>(await Bridge.DaemonStatus())

export const DaemonApplyConfig = async (channel: string, config: string) =>
  unwrap<DaemonConfigureResult>(await Bridge.DaemonApplyConfig(channel, config))

export const DaemonGetConfig = async () => unwrap<DaemonConfig>(await Bridge.DaemonGetConfig())

export const DaemonStart = async (channel: string) =>
  unwrap<DaemonCoreStatus>(await Bridge.DaemonStart(channel))

export const DaemonStop = async () => unwrap<DaemonCoreStatus>(await Bridge.DaemonStop())

export const DaemonRestart = async (channel: string) =>
  unwrap<DaemonCoreStatus>(await Bridge.DaemonRestart(channel))

export const DaemonSwitch = async (channel: string) =>
  unwrap<DaemonCoreStatus>(await Bridge.DaemonSwitch(channel))

export const DaemonReadLog = async (tailBytes: number) =>
  unwrap<DaemonLog>(await Bridge.DaemonReadLog(tailBytes))

export const DaemonClearCache = async () => {
  await unwrap<Record<string, never>>(await Bridge.DaemonClearCache())
}

export const DaemonWatch = async () => {
  const result = await Bridge.DaemonWatch()
  if (!result.flag) {
    throw parseError(result.data)
  }
}

/** Subscribe to daemon core state events. Returns an unsubscribe function. */
export const OnDaemonCoreState = (callback: (status: DaemonCoreStatus) => void) => {
  return EventsOn('daemonCoreState', (status: DaemonCoreStatus) => callback(status))
}
