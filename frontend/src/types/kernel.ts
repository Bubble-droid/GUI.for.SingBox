import type { TunStack } from '@features/constant/kernel'

export interface CoreApiConfigTun {
  enable: boolean
  stack: TunStack
  device: string
}

export interface CoreApiConfig {
  port: number
  'socks-port': number
  'mixed-port': number
  'interface-name': string
  'allow-lan': boolean
  mode: string
  tun: CoreApiConfigTun
}

export interface CoreApiProxyHistory {
  delay: number
}

export interface CoreApiProxy {
  alive: boolean
  all: string[]
  name: string
  now: string
  type: string
  udp: boolean
  history: CoreApiProxyHistory[]
}

export interface CoreApiProxies {
  proxies: Record<string, CoreApiProxy>
}

export interface CoreApiConnection {
  id: string
  chains: string[]
}

export interface CoreApiConnections {
  connections: CoreApiConnection[]
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

export interface CoreApiConnectionMetadata {
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

export interface CoreApiConnectionsDataConnection {
  chains: string[]
  download: number
  id: string
  metadata: CoreApiConnectionMetadata
  rule: string
  rulePayload: string
  start: string
  upload: number
}

export interface CoreApiConnectionsData {
  memory: number
  uploadTotal: number
  downloadTotal: number
  connections: CoreApiConnectionsDataConnection[]
}

export interface CoreApiWsDataMap {
  logs: CoreApiLogsData
  memory: CoreApiMemoryData
  traffic: CoreApiTrafficData
  connections: CoreApiConnectionsData
}
