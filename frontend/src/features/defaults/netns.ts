import { NetnsType } from '@features/constant/kernel'
import type { NetnsConfig, NetnsDefault, NetnsUnshare } from '@profiles/netns'

import { createSwitchable } from './shared'

type Result<T extends NetnsType> = Extract<NetnsConfig, { type: T }>

export const createNetns = <T extends NetnsType>(type: T): Result<T> => {
  switch (type) {
    case NetnsType.Default:
      return createNetnsDefault() as Result<T>
    case NetnsType.Unshare:
      return createNetnsUnshare() as Result<T>
    default:
      throw new Error(`Unexpected netns type: ${type}`)
  }
}

export const createNetnsDefault = (): NetnsDefault => {
  const type = NetnsType.Default
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ns`,
    config: {
      path: '',
    },
  }
}

export const createNetnsUnshare = (): NetnsUnshare => {
  const type = NetnsType.Unshare
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ns`,
    config: {
      pid_file: '',
    },
  }
}
