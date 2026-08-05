import type { typebox } from '@zhexin/typebox'

import type { UnpackArray } from './utils'

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

export type SingBoxNtp = NonNullable<SingBoxConfig['ntp']>

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
