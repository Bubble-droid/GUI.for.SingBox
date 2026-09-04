import type {
  Dns01Provider,
  DomainStrategy,
  NetworkStrategy,
  NetworkType,
  TlsCipherSuite,
  TlsClientAuthentication,
  TlsCurvePreference,
  TlsEngine,
  TlsSpoofMethod,
  TlsVersion,
  UdpNatBehavior,
  UtlsFingerprint,
} from '@profile/constant/kernel'

export type CertProviderId = string
export type HttpClientId = string
export type NetnsId = string
export type EndpointId = string
export type InboundId = string
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

export interface ListenForm {
  listen: string
  listen_port: number
  bind_interface: string
  routing_mark: number
  reuse_addr: boolean
  netns: NetnsId
  tcp_fast_open: boolean
  tcp_multi_path: boolean
  disable_tcp_keep_alive: boolean
  tcp_keep_alive: string
  tcp_keep_alive_interval: string
  udp_fragment: boolean
  udp_timeout: string
  detour: InboundId
}

export interface DnsRouteOptionsForm {
  disable_cache: boolean
  disable_optimistic_cache: boolean
  rewrite_ttl: number
  timeout: string
  client_subnet: string
}

export interface DomainResolverForm extends DnsRouteOptionsForm {
  server: DnsServerId
  strategy: DomainStrategy
}

export interface DialerForm {
  detour: OutboundId
  bind_interface: string
  inet4_bind_address: string
  inet6_bind_address: string
  bind_address_no_port: boolean
  protect_path: string
  routing_mark: number
  reuse_addr: boolean
  netns: NetnsId
  connect_timeout: string
  tcp_fast_open: boolean
  tcp_multi_path: boolean
  disable_tcp_keep_alive: boolean
  tcp_keep_alive: string
  tcp_keep_alive_interval: string
  udp_fragment: boolean
  domain_resolver: DomainResolverForm
  network_strategy: NetworkStrategy
  network_type: NetworkType[]
  fallback_network_type: NetworkType[]
  fallback_delay: string
  network_fallback_delay: string
}

export interface UdpNatForm {
  udp_timeout: string
  udp_mapping: UdpNatBehavior
  udp_filtering: UdpNatBehavior
  udp_nat_max: number
}

export interface InboundTlsEch {
  enabled: boolean
  key: string[]
  key_path: string
}

export interface InboundTlsRealityHandshake {
  server: string
  server_port: number
  dialer: DialerForm
}

export interface InboundTlsReality {
  enabled: boolean
  handshake: InboundTlsRealityHandshake
  private_key: string
  short_id: string[]
  max_time_difference: string
}

export interface InboundTlsForm {
  enabled: boolean
  server_name: string
  alpn: string[]
  min_version: TlsVersion
  max_version: TlsVersion
  cipher_suites: TlsCipherSuite[]
  curve_preferences: TlsCurvePreference[]
  certificate: string[]
  certificate_path: string
  client_authentication: TlsClientAuthentication
  client_certificate: string[]
  client_certificate_path: string[]
  client_certificate_public_key_sha256: string[]
  key: string[]
  key_path: string
  kernel_tx: boolean
  kernel_rx: boolean
  handshake_timeout: string
  certificate_provider: CertProviderId
  ech: InboundTlsEch
  reality: InboundTlsReality
}

export interface OutboundTlsEch {
  enabled: boolean
  config: string[]
  config_path: string
  query_server_name: string
}

export interface OutboundUtls {
  enabled: boolean
  fingerprint: UtlsFingerprint
}

export interface OutboundTlsReality {
  enabled: boolean
  public_key: string
  short_id: string[]
}

export interface OutboundTlsForm {
  enabled: boolean
  engine: TlsEngine
  disable_sni: boolean
  server_name: string
  insecure: boolean
  alpn: string[]
  min_version: TlsVersion
  max_version: TlsVersion
  cipher_suites: TlsCipherSuite[]
  curve_preferences: TlsCurvePreference[]
  certificate: string[]
  certificate_path: string
  certificate_public_key_sha256: string[]
  client_certificate: string[]
  client_certificate_path: string
  client_key: string[]
  client_key_path: string
  fragment: boolean
  fragment_fallback_delay: string
  record_fragment: boolean
  spoof: string
  spoof_method: TlsSpoofMethod
  kernel_tx: boolean
  kernel_rx: boolean
  handshake_timeout: string
  ech: OutboundTlsEch
  utls: OutboundUtls
  reality: OutboundTlsReality
}

export interface Http2Form {
  idle_timeout: string
  keep_alive_period: string
  stream_receive_window: string
  connection_receive_window: string
  max_concurrent_streams: number
}

export interface QuicForm extends Http2Form {
  initial_packet_size: number
  disable_path_mtu_discovery: boolean
}

export interface Dns01ChallengeBase {
  ttl: string
  propagation_delay: string
  propagation_timeout: string
  resolvers: DnsServerId[]
  override_domain: string
}

export interface AliDnsChallenge extends Dns01ChallengeBase {
  provider: typeof Dns01Provider.AliDns
  access_key_id: string
  access_key_secret: string
  region_id: string
  security_token: string
}

export interface CloudflareChallenge extends Dns01ChallengeBase {
  provider: typeof Dns01Provider.Cloudflare
  api_token: string
  zone_token: string
}

export interface AcmeDnsChallenge extends Dns01ChallengeBase {
  provider: typeof Dns01Provider.AcmeDns
  username: string
  password: string
  subdomain: string
  server_url: string
}

export type Dns01ChallengeForm = AliDnsChallenge | CloudflareChallenge | AcmeDnsChallenge
