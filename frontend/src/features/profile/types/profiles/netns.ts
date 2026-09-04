import type { NetnsType } from '@profile/constant/kernel'

import type { Switchable } from './shared'

export interface DefaultNetns extends Switchable {
  type: typeof NetnsType.Default
  config: {
    path: string
  }
}

export interface UnshareNetns extends Switchable {
  type: typeof NetnsType.Unshare
  config: {
    pid_file: string
  }
}

export type NetnsItem = DefaultNetns | UnshareNetns
