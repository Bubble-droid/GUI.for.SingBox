import type { Outbound } from '@/features/config/constant'
import type { TagItem } from '@/features/config/types'

export interface ProxyConfig extends TagItem {
  type: string
}

export interface OutboundConfig extends TagItem {
  type: Outbound
  outbounds: ProxyConfig[]
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
