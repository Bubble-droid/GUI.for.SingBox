import type { InboundType, Network, TunStack } from '@profile/constant/kernel'

import type { TagItem } from './shared'

export interface InboundListen {
  listen: string
  listen_port: number
  tcp_fast_open: boolean
  tcp_multi_path: boolean
  udp_fragment: boolean
}

export interface InboundItem extends TagItem {
  type: InboundType
  enable: boolean
  direct?: {
    listen: InboundListen
    network: Network
  }
  mixed?: {
    listen: InboundListen
    users: string[]
  }
  socks?: {
    listen: InboundListen
    users: string[]
  }
  http?: {
    listen: InboundListen
    users: string[]
  }
  tun?: {
    interface_name: string
    address: string[]
    mtu: number
    auto_route: boolean
    strict_route: boolean
    route_address: string[]
    route_exclude_address: string[]
    endpoint_independent_nat: boolean
    stack: TunStack
  }
}
