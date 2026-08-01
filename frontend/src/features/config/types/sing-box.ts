import type { typebox } from '@zhexin/typebox'

import type { UnpackArray } from '@/features/types'

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

export type SingBoxDomainResolver = Extract<
  NonNullable<SingBoxOutboundOf<'direct'>['domain_resolver']>,
  object
>

export type SingBoxDialer = Omit<SingBoxOutboundOf<'direct'>, 'tag' | 'type'>

export type SingBoxNtp = NonNullable<SingBoxConfig['ntp']>

export type SingBoxOutbound = Extract<
  UnpackArray<NonNullable<SingBoxConfig['outbounds']>>,
  { type: unknown }
>

export type SingBoxOutboundOf<T extends SingBoxOutbound['type']> = Extract<
  SingBoxOutbound,
  { type: T }
>
