import type { DnsConfig } from './dns'
import type { EndpointConfig } from './endpoints'
import type { ExperimentalConfig } from './experimental'
import type { InboundConfig } from './inbounds'
import type { LogConfig } from './log'
import type { MixinConfig, ScriptConfig } from './mixin-script'
import type { NtpConfig } from './ntp'
import type { OutboundConfig } from './outbounds'
import type { RouteConfig } from './route'

export type * from './shared'
export type * from './log'
export type * from './ntp'
export type * from './experimental'
export type * from './endpoints'
export type * from './inbounds'
export type * from './outbounds'
export type * from './route'
export type * from './dns'
export type * from './mixin-script'

export interface Profile {
  id: string
  name: string
  schema: string
  log: LogConfig
  ntp: NtpConfig
  experimental: ExperimentalConfig
  endpoints: EndpointConfig[]
  inbounds: InboundConfig[]
  outbounds: OutboundConfig[]
  route: RouteConfig
  dns: DnsConfig
  mixin: MixinConfig
  script: ScriptConfig
}
