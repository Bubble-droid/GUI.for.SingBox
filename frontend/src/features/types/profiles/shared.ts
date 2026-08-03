import type {
  DomainStrategy,
  NetworkStrategy,
  NetworkType,
  UdpNatBehavior,
} from '@features/constant/kernel'

export type OutboundId = string
export type DnsServerId = string

export interface TagItem {
  id: string
  tag: string
}

export interface ProfileBase extends TagItem {
  fields: string
}

export interface Switchable extends ProfileBase {
  enable: boolean
}

export interface DnsRouteOptions {
  disable_cache: boolean
  disable_optimistic_cache: boolean
  rewrite_ttl: number
  timeout: string
  client_subnet: string
}

export interface DomainResolver extends DnsRouteOptions {
  server: DnsServerId
  strategy: DomainStrategy
}

export interface Dialer {
  detour: OutboundId
  bind_interface: string
  inet4_bind_address: string
  inet6_bind_address: string
  bind_address_no_port: boolean
  protect_path: string
  routing_mark: number
  reuse_addr: boolean
  netns: string
  connect_timeout: string
  tcp_fast_open: boolean
  tcp_multi_path: boolean
  disable_tcp_keep_alive: boolean
  tcp_keep_alive: string
  tcp_keep_alive_interval: string
  udp_fragment: boolean
  domain_resolver: DomainResolver
  network_strategy: NetworkStrategy
  network_type: NetworkType[]
  fallback_network_type: NetworkType[]
  fallback_delay: string
  network_fallback_delay: string
}

export interface UdpNat {
  udp_timeout: string
  udp_mapping: UdpNatBehavior
  udp_filtering: UdpNatBehavior
  udp_nat_max: number
}
