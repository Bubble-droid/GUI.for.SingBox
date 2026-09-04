import { NetnsType } from '@profile/constant/kernel'
import type { DefaultNetns, NetnsItem, UnshareNetns } from '@profile/types/profiles/netns'

import { createSwitchable } from './shared'

type Result<T extends NetnsType> = Extract<NetnsItem, { type: T }>

const createDefaultNetns = (): DefaultNetns => {
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

const createUnshareNetns = (): UnshareNetns => {
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

export const createNetns = <T extends NetnsType>(type: T): Result<T> => {
  switch (type) {
    case NetnsType.Default: {
      return createDefaultNetns() as Result<T>
    }
    case NetnsType.Unshare: {
      return createUnshareNetns() as Result<T>
    }
    default: {
      throw new Error(`Unexpected netns type: ${type}`)
    }
  }
}
