import type { CertificateProviderOf, OutboundOf, InboundOf, EndpointOf, HttpClient } from './config'

export type Dns01ChallengeOptions = NonNullable<CertificateProviderOf<'acme'>['dns01_challenge']>

export type Http2Options = Pick<
  Extract<HttpClient, { version?: 2 }>,
  | 'idle_timeout'
  | 'keep_alive_period'
  | 'stream_receive_window'
  | 'connection_receive_window'
  | 'max_concurrent_streams'
>

export type QuicOptions = Pick<
  Extract<HttpClient, { version: 3 }>,
  'initial_packet_size' | 'disable_path_mtu_discovery'
> &
  Http2Options

export type DomainResolverOptions = Extract<
  NonNullable<OutboundOf<'direct'>['domain_resolver']>,
  object
>

export type ListenOptions = Omit<InboundOf<'redirect'>, 'tag' | 'type'>

export type DialerOptions = Omit<OutboundOf<'direct'>, 'tag' | 'type'>

export type UdpNatOptions = Pick<
  EndpointOf<'wireguard'>,
  'udp_timeout' | 'udp_mapping' | 'udp_filtering' | 'udp_nat_max'
>

export type OutboundTlsOptions = NonNullable<OutboundOf<'http'>['tls']>

export type InboundTlsOptions = NonNullable<InboundOf<'http'>['tls']>
