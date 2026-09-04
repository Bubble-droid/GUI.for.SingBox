import { Dns01Provider } from '@profile/constant/kernel'
import type {
  DomainStrategy,
  NetworkStrategy,
  TlsClientAuthentication,
  TlsEngine,
  TlsSpoofMethod,
  TlsVersion,
  UdpNatBehavior,
  UtlsFingerprint,
} from '@profile/constant/kernel'
import type {
  TagItem,
  ProfileBase,
  Switchable,
  Dns01ChallengeBase,
  DomainResolverForm,
  DialerForm,
  UdpNatForm,
  ListenForm,
  InboundTlsForm,
  OutboundTlsForm,
  Http2Form,
  QuicForm,
  Dns01ChallengeForm,
  DnsRouteOptionsForm,
} from '@profile/types/profiles/shared'

import { sampleID } from '@/utils/others'

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

export const createDnsRouteOptions = (): DnsRouteOptionsForm => ({
  disable_cache: false,
  disable_optimistic_cache: false,
  rewrite_ttl: 0,
  timeout: '',
  client_subnet: '',
})

export const createDomainResolver = (): DomainResolverForm => ({
  ...createDnsRouteOptions(),
  server: '',
  strategy: '' as DomainStrategy,
})

export const createDialer = (): DialerForm => ({
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

export const createUdpNat = (): UdpNatForm => ({
  udp_timeout: '',
  udp_mapping: '' as UdpNatBehavior,
  udp_filtering: '' as UdpNatBehavior,
  udp_nat_max: 0,
})

export const createListen = (): ListenForm => ({
  listen: '',
  listen_port: 0,
  bind_interface: '',
  routing_mark: 0,
  reuse_addr: false,
  netns: '',
  tcp_fast_open: false,
  tcp_multi_path: false,
  disable_tcp_keep_alive: false,
  tcp_keep_alive: '',
  tcp_keep_alive_interval: '',
  udp_fragment: false,
  udp_timeout: '',
  detour: '',
})

export const createInboundTls = (): InboundTlsForm => ({
  enabled: false,
  server_name: '',
  alpn: [],
  min_version: '' as TlsVersion,
  max_version: '' as TlsVersion,
  cipher_suites: [],
  curve_preferences: [],
  certificate: [],
  certificate_path: '',
  client_authentication: '' as TlsClientAuthentication,
  client_certificate: [],
  client_certificate_path: [],
  client_certificate_public_key_sha256: [],
  key: [],
  key_path: '',
  kernel_tx: false,
  kernel_rx: false,
  handshake_timeout: '',
  certificate_provider: '',
  ech: {
    enabled: false,
    key: [],
    key_path: '',
  },
  reality: {
    enabled: false,
    handshake: {
      server: '',
      server_port: 0,
      dialer: createDialer(),
    },
    private_key: '',
    short_id: [],
    max_time_difference: '',
  },
})

export const createOutboundTls = (): OutboundTlsForm => ({
  enabled: false,
  engine: '' as TlsEngine,
  disable_sni: false,
  server_name: '',
  insecure: false,
  alpn: [],
  min_version: '' as TlsVersion,
  max_version: '' as TlsVersion,
  cipher_suites: [],
  curve_preferences: [],
  certificate: [],
  certificate_path: '',
  certificate_public_key_sha256: [],
  client_certificate: [],
  client_certificate_path: '',
  client_key: [],
  client_key_path: '',
  fragment: false,
  fragment_fallback_delay: '',
  record_fragment: false,
  spoof: '',
  spoof_method: '' as TlsSpoofMethod,
  kernel_tx: false,
  kernel_rx: false,
  handshake_timeout: '',
  ech: {
    enabled: false,
    config: [],
    config_path: '',
    query_server_name: '',
  },
  utls: {
    enabled: false,
    fingerprint: '' as UtlsFingerprint,
  },
  reality: {
    enabled: false,
    public_key: '',
    short_id: [],
  },
})

export const createHttp2Options = (): Http2Form => ({
  idle_timeout: '',
  keep_alive_period: '',
  stream_receive_window: '',
  connection_receive_window: '',
  max_concurrent_streams: 0,
})

export const createQuicOptions = (): QuicForm => ({
  ...createHttp2Options(),
  initial_packet_size: 0,
  disable_path_mtu_discovery: false,
})

export const createDns01Challenge = (provider?: Dns01Provider): Dns01ChallengeForm => {
  const base: Dns01ChallengeBase = {
    ttl: '',
    propagation_delay: '',
    propagation_timeout: '',
    resolvers: [],
    override_domain: '',
  }
  if (!provider) {
    return {
      ...base,
      provider: '' as Dns01Provider,
    } as Dns01ChallengeForm
  }
  switch (provider) {
    case Dns01Provider.AliDns: {
      return {
        ...base,
        provider: Dns01Provider.AliDns,
        access_key_id: '',
        access_key_secret: '',
        region_id: '',
        security_token: '',
      }
    }
    case Dns01Provider.Cloudflare: {
      return {
        ...base,
        provider: Dns01Provider.Cloudflare,
        api_token: '',
        zone_token: '',
      }
    }
    case Dns01Provider.AcmeDns: {
      return {
        ...base,
        provider: Dns01Provider.AcmeDns,
        username: '',
        password: '',
        subdomain: '',
        server_url: '',
      }
    }
    default: {
      throw new Error(`Unexpected DNS provider: ${provider as string}`)
    }
  }
}
