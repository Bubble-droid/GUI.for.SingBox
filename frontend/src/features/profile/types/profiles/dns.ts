import type {
  DnsActionKind,
  DnsRuleType,
  DnsServerType,
  DomainStrategy,
} from '@profile/constant/kernel'

import type { Recordable } from '@/types/typescript'

import type { TagItem } from './shared'

export interface DnsServerItem extends TagItem {
  type: DnsServerType
  // [local,tcp,udp,tls,quic,https/h3,dhcp]
  detour: string
  domain_resolver: string
  // hosts
  hosts_path: string[]
  predefined: Recordable<string>
  // [tcp,udp,tls,quic/https,h3]
  server: string
  server_port: string
  // [https,h3]
  path: string
  // dhcp
  interface: string
  // fakeip
  inet4_range: string
  inet6_range: string
}

export interface DnsRuleItem {
  id: string
  type: DnsRuleType
  enable: boolean
  payload: string
  action: DnsActionKind
  invert: boolean
  // route
  server: string
  strategy: DomainStrategy
  // route/route-options
  disable_cache: boolean
  client_subnet: string
}

export interface DnsSection {
  servers: DnsServerItem[]
  rules: DnsRuleItem[]
  disable_cache: boolean
  disable_expire: boolean
  independent_cache: boolean
  client_subnet: string
  final: string
  strategy: DomainStrategy
}
