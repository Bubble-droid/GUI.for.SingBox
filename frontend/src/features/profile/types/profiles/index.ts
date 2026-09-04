import type { CertStore, HttpEngine, HttpVersion, LogLevel } from '@profile/constant/kernel'

import type { Recordable } from '@/types/typescript'

import type { CertProviderItem } from './certificate_provider'
import type { DnsSection } from './dns'
import type { EndpointItem } from './endpoints'
import type { InboundItem } from './inbounds'
import type { NetnsItem } from './netns'
import type { OutboundItem } from './outbounds'
import type { RouteSection } from './route'
import type {
  DialerForm,
  Http2Form,
  OutboundId,
  OutboundTlsForm,
  QuicForm,
  Switchable,
} from './shared'

type MixinPriority = 'mixin' | 'gui'

export interface Mixin {
  priority: MixinPriority
  format: 'json' | 'yaml'
  config: string
}

export interface Script {
  code: string
}

export interface LogSection {
  disabled: boolean
  level: LogLevel
  output: string
  timestamp: boolean
}

export interface NtpSection {
  enabled: boolean
  server: string
  server_port: number
  interval: string
  dialer: DialerForm
}

export interface CertSection {
  store: CertStore
  certificate: string[]
  certificate_path: string[]
  certificate_directory_path: string[]
}

export interface HttpClientItem extends Switchable {
  config: {
    engine: HttpEngine
    version: HttpVersion
    disable_version_fallback: boolean
    headers: Recordable<string>
    http2: Http2Form
    quic: QuicForm
    tls: OutboundTlsForm
    dialer: DialerForm
  }
}

export interface ExperimentalSection {
  clash_api: {
    external_controller: string
    external_ui: string
    external_ui_download_url: string
    external_ui_download_detour: OutboundId
    secret: string
    default_mode: string
    access_control_allow_origin: string[]
    access_control_allow_private_network: boolean
  }
  cache_file: {
    enabled: boolean
    path: string
    cache_id: string
    store_fakeip: boolean
    store_dns: boolean
  }
}

export interface Profile {
  id: string
  name: string
  schema: string
  log: LogSection
  ntp: NtpSection
  experimental: ExperimentalSection
  cert: CertSection
  certProviders: CertProviderItem[]
  httpClients: HttpClientItem[]
  netns: NetnsItem[]
  endpoints: EndpointItem[]
  inbounds: InboundItem[]
  outbounds: OutboundItem[]
  route: RouteSection
  dns: DnsSection
  mixin: Mixin
  script: Script
}
