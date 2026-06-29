import type {
  CommonRuleType,
  NetworkType,
  IpVersion,
  SniffProtocol,
  NetworkStrategy,
  TlsSpoofMethod,
  DomainStrategy,
} from '@/enums'
import type { Recordable } from '@/types'

export interface TagItem {
  id: string
  tag: string
}

export interface ProfileBase extends TagItem {
  fields: string
}

export interface SwitchableProfile extends ProfileBase {
  enable: boolean
}

export interface RuleBaseProfile {
  id: string
  enable: boolean
  fields: string
}

export type InboundId = string
export type OutboundId = string
export type HttpClientId = string
export type RuleSetId = string
export type DnsServerId = string

export type ProxyId = string
export type SubscriptionId = string

 type CommonRuleValues = {
  [CommonRuleType.Invert]: boolean
  [CommonRuleType.NetworkType]: NetworkType[]
  [CommonRuleType.NetworkIsExpensive]: boolean
  [CommonRuleType.NetworkIsConstrained]: boolean
  [CommonRuleType.InterfaceAddress]: Recordable<string>
  [CommonRuleType.NetworkInterfaceAddress]: Recordable<string>
  [CommonRuleType.IpVersion]: IpVersion
  [CommonRuleType.Protocol]: SniffProtocol[]
  [CommonRuleType.IpIsPrivate]: boolean
  [CommonRuleType.SourceIpIsPrivate]: boolean
  [CommonRuleType.ClashMode]: string
  [CommonRuleType.RuleSetIpCidrMatchSource]: boolean
}

export type CommonRuleItem = {
  [K in CommonRuleType]: {
    type: K
    value: K extends keyof CommonRuleValues ? CommonRuleValues[K] : string[]
  }
}[CommonRuleType]

export interface RouteOptions {
  override_address: string
  override_port: number
  network_strategy: NetworkStrategy
  fallback_delay: string
  udp_disable_domain_unmapping: boolean
  udp_connect: boolean
  udp_timeout: string
  tls_fragment: boolean
  tls_fragment_fallback_delay: string
  tls_record_fragment: boolean
  tls_spoof: string
  /**
   * @default wrong-sequence
   */
  tls_spoof_method: TlsSpoofMethod
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

export interface Listen {
  listen: string
  listen_port: number
  bind_interface: string
  routing_mark: number
  reuse_addr: boolean
  netns: string
  tcp_fast_open: boolean
  tcp_multi_path: boolean
  disable_tcp_keep_alive: boolean
  tcp_keep_alive: string
  tcp_keep_alive_interval: string
  udp_fragment: boolean
  udp_timeout: string
  detour: InboundId
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
