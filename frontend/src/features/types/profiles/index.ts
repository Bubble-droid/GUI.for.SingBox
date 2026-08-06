import type { CertificateConfig } from './certificate'
import type { DnsConfig } from './dns'
import type { EndpointConfig } from './endpoints'
import type { ExperimentalConfig } from './experimental'
import type { HttpClientConfig } from './http_client'
import type { InboundConfig } from './inbounds'
import type { LogConfig } from './log'
import type { MixinConfig, ScriptConfig } from './mixin-script'
import type { NetnsConfig } from './netns'
import type { NtpConfig } from './ntp'
import type { OutboundConfig } from './outbounds'
import type { RouteConfig } from './route'

export interface Profile {
  id: string
  name: string
  schema: string
  log: LogConfig
  ntp: NtpConfig
  experimental: ExperimentalConfig
  certificate: CertificateConfig
  http_clients: HttpClientConfig[]
  network_namespaces: NetnsConfig[]
  endpoints: EndpointConfig[]
  inbounds: InboundConfig[]
  outbounds: OutboundConfig[]
  route: RouteConfig
  dns: DnsConfig
  mixin: MixinConfig
  script: ScriptConfig
}
