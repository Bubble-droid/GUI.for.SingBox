import type { typebox } from '@zhexin/typebox'
import type { dns } from '@zhexin/typebox/dns'
import type { endpoint } from '@zhexin/typebox/endpoint'
import type { inbound } from '@zhexin/typebox/inbound'
import type { outbound } from '@zhexin/typebox/outbound'
import type { route } from '@zhexin/typebox/route'
import type { service } from '@zhexin/typebox/service'

import type { DnsServer, Inbound, Outbound } from '@/enums/kernel'

export interface CoreApiConfig {
  port: number
  'socks-port': number
  'mixed-port': number
  'interface-name': string
  'allow-lan': boolean
  mode: string
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
  connections: {
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

export type CoreApiWsDataMap = {
  logs: CoreApiLogsData
  memory: CoreApiMemoryData
  traffic: CoreApiTrafficData
  connections: CoreApiConnectionsData
}

export type CoreConfigSchema = typebox<
  outbound<string, string, string>,
  endpoint<string, string, string>,
  inbound<string, string, string, string, string>,
  service<string, string, string, string>,
  dns.server<string, string, string, string>,
  route.rule_set<string, string>
>

export type CoreConfigLog = NonNullable<CoreConfigSchema['log']>

export type CoreConfigExperimental = NonNullable<CoreConfigSchema['experimental']>

export type CoreConfigInbound = Extract<
  UnpackArray<NonNullable<CoreConfigSchema['inbounds']>>,
  { type: Inbound }
>

export type CoreConfigInboundOf<T extends CoreConfigInbound['type']> = Extract<
  CoreConfigInbound,
  { type: T }
>

export type CoreConfigOutbound = Extract<
  UnpackArray<NonNullable<CoreConfigSchema['outbounds']>>,
  { type: Outbound }
>

export type CoreConfigOutboundOf<T extends CoreConfigOutbound['type']> = Extract<
  CoreConfigOutbound,
  { type: T }
>

export type CoreConfigRoute = NonNullable<CoreConfigSchema['route']>

export type CoreConfigDns = NonNullable<CoreConfigSchema['dns']>

export type CoreConfigDnsServer = Extract<
  UnpackArray<NonNullable<CoreConfigDns['servers']>>,
  { type: DnsServer }
>

export type CoreConfigDnsServerOf<T extends CoreConfigDnsServer['type']> = Extract<
  CoreConfigDnsServer,
  { type: T }
>
