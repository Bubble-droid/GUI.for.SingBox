import type { typebox } from '@zhexin/typebox'

import type { UnpackArray } from '../../types/utils'

export type { log as SingBoxLogConfig } from '@zhexin/typebox/log'
export type { experimental as SingBoxExperimental } from '@zhexin/typebox/experimental'

export type SingBoxConfig = typebox<
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
>

export type SingBoxNtp = NonNullable<SingBoxConfig['ntp']>

export type SingBoxCert = NonNullable<SingBoxConfig['certificate']>

export type SingBoxCertificateProvider = UnpackArray<
  NonNullable<SingBoxConfig['certificate_providers']>
>

export type SingBoxCertificateProviderOf<T extends SingBoxCertificateProvider['type']> = Extract<
  SingBoxCertificateProvider,
  { type: T }
>

export type SingBoxDns01Challenge = NonNullable<
  SingBoxCertificateProviderOf<'acme'>['dns01_challenge']
>
export type SingBoxHttpClient = UnpackArray<NonNullable<SingBoxConfig['http_clients']>>

export type SingBoxHttp2 = Pick<
  Extract<SingBoxHttpClient, { version: 3 }>,
  | 'idle_timeout'
  | 'keep_alive_period'
  | 'stream_receive_window'
  | 'connection_receive_window'
  | 'max_concurrent_streams'
>

export type SingBoxQuic = Pick<
  Extract<SingBoxHttpClient, { version: 3 }>,
  'initial_packet_size' | 'disable_path_mtu_discovery'
> &
  SingBoxHttp2

export type SingBoxNetns = UnpackArray<NonNullable<SingBoxConfig['network_namespaces']>>

export type SingBoxNetnsOf<T extends NonNullable<SingBoxNetns['type']>> = Extract<
  SingBoxNetns,
  { type?: T }
>

export type SingBoxDomainResolver = Extract<
  NonNullable<SingBoxOutboundOf<'direct'>['domain_resolver']>,
  object
>

export type SingBoxListen = Omit<SingBoxInboundOf<'redirect'>, 'tag' | 'type'>

export type SingBoxDialer = Omit<SingBoxOutboundOf<'direct'>, 'tag' | 'type'>

export type SingBoxUdpNat = Pick<
  SingBoxEndpointOf<'wireguard'>,
  'udp_timeout' | 'udp_mapping' | 'udp_filtering' | 'udp_nat_max'
>

export type SingBoxOutboundTls = NonNullable<SingBoxOutboundOf<'http'>['tls']>

export type SingBoxInboundTls = NonNullable<SingBoxInboundOf<'http'>['tls']>

export type SingBoxInbound = UnpackArray<NonNullable<SingBoxConfig['inbounds']>>

export type SingBoxInboundOf<T extends SingBoxInbound['type']> = Extract<
  SingBoxInbound,
  { type: T }
>

type UnionOutbound = UnpackArray<NonNullable<SingBoxConfig['outbounds']>>

export type SingBoxOutbound = Extract<UnionOutbound, { type: unknown }>

export type SingBoxOutboundOf<T extends SingBoxOutbound['type']> = Extract<
  SingBoxOutbound,
  { type: T }
>

type UnionEndpoint = UnpackArray<NonNullable<SingBoxConfig['endpoints']>>

export type SingBoxEndpoint =
  | Extract<UnionEndpoint, { type: unknown }>
  | (Extract<UnionEndpoint, { flavor?: unknown }> & { type: 'openconnect' })

export type SingBoxEndpointOf<T extends SingBoxEndpoint['type']> = Extract<
  SingBoxEndpoint,
  { type: T }
>
