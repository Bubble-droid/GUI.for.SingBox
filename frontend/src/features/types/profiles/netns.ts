import type { NetnsType } from '@features/constant/kernel'

import type { Switchable } from './shared'

export interface NetnsDefault extends Switchable {
  type: typeof NetnsType.Default
  config: {
    path: string
  }
}

export interface NetnsUnshare extends Switchable {
  type: typeof NetnsType.Unshare
  config: {
    pid_file: string
  }
}

export type NetnsConfig = NetnsDefault | NetnsUnshare
