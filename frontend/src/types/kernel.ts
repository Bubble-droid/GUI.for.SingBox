import type { typebox } from '@zhexin/typebox'
import type {
  action as DnsAction,
  default_rule as DnsDefaultRule,
  logical_rule as DnsLogicalRule,
} from '@zhexin/typebox/dns'
import type { action, default_rule, logical_rule } from '@zhexin/typebox/route'

import type { Recordable, UnpackArray } from './utils'

export type { log as CoreLogConfig } from '@zhexin/typebox/log'
export type {
  experimental as CoreExperimentalConfig,
  clash_api as CoreClashApiConfig,
  cache_file as CoreCacheFileConfig,
} from '@zhexin/typebox/experimental'

export interface CoreApiConfig {
  port: number
  'socks-port': number
  'mixed-port': number
  'interface-name': string
  'allow-lan': boolean
  mode: string
  'mode-list': string[]
  tun: {
    enable: boolean
    stack: string
    device: string
  }
}

export interface CoreApiProxy {
  alive: boolean
  all: string[]
  name: string
  now: string
  type: string
  udp: boolean
  history: {
    delay: number
  }[]
}

export interface CoreApiProxies {
  proxies: Recordable<CoreApiProxy>
}

export interface CoreApiConnections {
  connections?: {
    id: string
    chains: string[]
  }[]
}

export interface CoreApiTrafficData {
  down: number
  up: number
}

export interface CoreApiMemoryData {
  inuse: number
  oslimit: number
}

export interface CoreApiLogsData {
  type: string
  payload: string
}

export interface CoreApiConnectionsData {
  memory: number
  uploadTotal: number
  downloadTotal: number
  connections: {
    chains: string[]
    download: number
    id: string
    metadata: {
      destinationIP: string
      destinationPort: string
      dnsMode: string
      host: string
      network: string
      processPath: string
      sourceIP: string
      sourcePort: string
      type: string
    }
    rule: string
    rulePayload: string
    start: string
    upload: number
  }[]
}

export interface CoreApiWsDataMap {
  logs: CoreApiLogsData
  memory: CoreApiMemoryData
  traffic: CoreApiTrafficData
  connections: CoreApiConnectionsData
}

export type CoreConfig = typebox<string, string, string, string, string, string, string, string>

export type CoreNtpConfig = NonNullable<CoreConfig['ntp']>

export type CoreListen = Omit<CoreInboundOf<'socks'>, 'tag' | 'type' | 'users'>

export type CoreDomainResolver = NonNullable<CoreRouteConfig['default_domain_resolver']>

export type CoreDialer = Omit<CoreOutboundOf<'direct'>, 'tag' | 'type'>

export type CoreEndpointConfig = Extract<
  UnpackArray<NonNullable<CoreConfig['endpoints']>>,
  { type: unknown }
>

export type CoreEndpointOf<T extends CoreEndpointConfig['type']> = Extract<
  CoreEndpointConfig,
  { type: T }
>

export type CoreInboundConfig = UnpackArray<NonNullable<CoreConfig['inbounds']>>

export type CoreInboundOf<T extends CoreInboundConfig['type']> = Extract<
  CoreInboundConfig,
  { type: T }
>

export type CoreOutboundConfig = Extract<
  UnpackArray<NonNullable<CoreConfig['outbounds']>>,
  { type: unknown }
>

export type CoreOutboundOf<T extends CoreOutboundConfig['type']> = Extract<
  CoreOutboundConfig,
  { type: T }
>

export type CoreRouteConfig = NonNullable<CoreConfig['route']>

export type CoreRuleSetConfig = UnpackArray<NonNullable<CoreRouteConfig['rule_set']>>

export type CoreRuleSetOf<T extends CoreRuleSetConfig['type']> = Extract<
  CoreRuleSetConfig,
  { type: T }
>

export type CoreRouteRuleConfig = UnpackArray<NonNullable<CoreRouteConfig['rules']>>

export type CoreRouteAction = action<string, string>

export type CoreRouteActionOf<T extends CoreRouteAction['action']> = Extract<
  CoreRouteAction,
  { action: T }
>

export type CoreRouteDefaultRule = default_rule<string, string, string>

export type CoreRouteLogicalRule = logical_rule<string, string, string, string>

export type CoreDnsConfig = NonNullable<CoreConfig['dns']>

export type CoreDnsServerConfig = Extract<
  UnpackArray<NonNullable<CoreDnsConfig['servers']>>,
  { type: unknown }
>

export type CoreDnsRuleConfig = UnpackArray<NonNullable<CoreDnsConfig['rules']>>

export type CoreDnsAction = DnsAction<string>

export type CoreDnsActionOf<T extends CoreDnsAction['action']> = Extract<
  CoreDnsAction,
  { action: T }
>

export type CoreDnsDefaultRule = DnsDefaultRule<string, string, string, string>

export type CoreDnsLogicalRule = DnsLogicalRule<string, string, string, string>

export type CoreDnsServerOf<T extends CoreDnsServerConfig['type']> = Extract<
  CoreDnsServerConfig,
  { type: T }
>

export type CoreServiceConfig = UnpackArray<NonNullable<CoreConfig['services']>>

export type CoreServiceOf<T extends CoreServiceConfig['type']> = Extract<
  CoreServiceConfig,
  { type: T }
>

export type CoreHttpClientConfig = UnpackArray<NonNullable<CoreConfig['http_clients']>>
