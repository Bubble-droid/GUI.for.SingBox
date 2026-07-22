import type { Inbound, TunDnsMode, TunStack, Network } from '@/enums'

import type { Recordable } from '../utils'
import type { SwitchableProfile, Listen, RuleSetId } from './shared'

// Inbound & Outbound Profiles
type AuthInboundType = typeof Inbound.Mixed | typeof Inbound.Socks | typeof Inbound.Http

export interface InboundAuthProfile extends SwitchableProfile {
  type: AuthInboundType
  config: {
    listen: Listen
    users: Recordable<string>
  }
}

export interface InboundTunProfile extends SwitchableProfile {
  type: typeof Inbound.Tun
  config: {
    interface_name: string
    address: string[]
    mtu: number
    dns_mode: TunDnsMode
    dns_address: string[]
    auto_route: boolean
    auto_redirect: boolean
    strict_route: boolean
    endpoint_independent_nat: boolean
    stack: TunStack
    route_address: string[]
    route_exclude_address: string[]
    route_address_set: RuleSetId[]
    route_exclude_address_set: RuleSetId[]
    include_interface: string[]
    exclude_interface: string[]
  }
}

export interface InboundNetworkProfile extends SwitchableProfile {
  type: typeof Inbound.Direct | typeof Inbound.Tproxy
  config: {
    listen: Listen
    network: Exclude<Network, typeof Network.Icmp>
  }
}

export interface InboundAnyProfile extends SwitchableProfile {
  type: Exclude<
    Inbound,
    AuthInboundType | typeof Inbound.Tun | typeof Inbound.Direct | typeof Inbound.Tproxy
  >
  config: {
    listen: Listen
  }
}

export type InboundProfile =
  | InboundAuthProfile
  | InboundTunProfile
  | InboundNetworkProfile
  | InboundAnyProfile
