import type { OutboundType } from '@profile/constant/kernel'

import type { TagItem } from './shared'

export interface OutboundChild extends TagItem {
  type: string
}

export interface OutboundItem extends TagItem {
  type: OutboundType
  outbounds: OutboundChild[]
  url: string
  interval: string
  tolerance: number
  interrupt_exist_connections: boolean
  // gui
  include: string
  exclude: string
  icon: string
  hidden: boolean
}
