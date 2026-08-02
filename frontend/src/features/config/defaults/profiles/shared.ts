import { sampleID } from '@/utils'

import type { UdpNatBehavior } from '@/enums'
import type { DomainStrategy, NetworkStrategy } from '@/enums'
import type {
  Dialer,
  DnsRouteOptions,
  DomainResolver,
  ProfileBase,
  Switchable,
  TagItem,
  UdpNat,
} from '@/features/config/types'

export const DefaultOutboundIds = {
  Select: 'outbound-select',
  Urltest: 'outbound-urltest',
  Direct: 'outbound-direct',
  Block: 'outbound-block',
  Fallback: 'outbound-fallback',
  Global: 'outbound-global',
} as const

export const DefaultInboundIds = {
  MixedIn: 'mixed-in',
  Tun: 'tun-in',
} as const

export const DefaultRulesetIds = {
  CATEGORY_ADS: 'Category-Ads',
  GEOIP_CN: 'GeoIP-CN',
  GEOSITE_CN: 'GeoSite-CN',
  GEOLOCATION_NOT_CN: 'GeoLocation-!CN',
  GEOSITE_PRIVATE: 'GeoSite-Private',
  GEOIP_PRIVATE: 'GeoIP-Private',
} as const

export const DefaultDnsServersIds = {
  LocalDns: 'Local-DNS',
  RemoteDns: 'Remote-DNS',
  FakeIP: 'Fake-IP',
  LocalDnsResolver: 'Local-DNS-Resolver',
  RemoteDnsResolver: 'Remote-DNS-Resolver',
} as const

export const createTagItem = (): TagItem => ({
  id: sampleID(),
  tag: '',
})

export const createProfileBase = (): ProfileBase => ({
  ...createTagItem(),
  fields: '{}',
})

export const createSwitchable = (): Switchable => ({
  ...createProfileBase(),
  enable: true,
})

export const createDnsRouteOptions = (): DnsRouteOptions => ({
  disable_cache: false,
  disable_optimistic_cache: false,
  rewrite_ttl: 0,
  timeout: '',
  client_subnet: '',
})

export const createDomainResolver = (): DomainResolver => ({
  ...createDnsRouteOptions(),
  server: '',
  strategy: '' as DomainStrategy,
})

export const createDialer = (): Dialer => ({
  detour: '',
  bind_interface: '',
  inet4_bind_address: '',
  inet6_bind_address: '',
  bind_address_no_port: false,
  protect_path: '',
  routing_mark: 0,
  reuse_addr: false,
  netns: '',
  connect_timeout: '',
  tcp_fast_open: false,
  tcp_multi_path: false,
  disable_tcp_keep_alive: false,
  tcp_keep_alive: '',
  tcp_keep_alive_interval: '',
  udp_fragment: false,
  domain_resolver: createDomainResolver(),
  network_strategy: '' as NetworkStrategy,
  network_type: [],
  fallback_network_type: [],
  fallback_delay: '',
  network_fallback_delay: '',
})

export const createUdpNat = (): UdpNat => ({
  udp_timeout: '',
  udp_mapping: '' as UdpNatBehavior,
  udp_filtering: '' as UdpNatBehavior,
  udp_nat_max: 0,
})
