import type { typebox } from '@zhexin/typebox'
import type { openconnect } from '@zhexin/typebox/endpoint'

import type { ByType, Discriminated, ItemOf } from './utils'

type TypeBox = Required<
  typebox<string, string, string, string, string, string, string, string, string>
>

export type Config = {
  [K in keyof TypeBox]?: TypeBox[K] extends readonly unknown[] ? ItemOf<TypeBox[K]>[] : TypeBox[K]
}

export type Log = NonNullable<Config['log']>
export type Ntp = NonNullable<Config['ntp']>
export type Experimental = NonNullable<Config['experimental']>
export type Certificate = NonNullable<Config['certificate']>
export type Route = NonNullable<Config['route']>
export type Dns = NonNullable<Config['dns']>

export type HttpClient = ItemOf<Config['http_clients']>

// Inbound
export type Inbound = ItemOf<Config['inbounds']>
export type InboundOf<T extends Inbound['type']> = ByType<Inbound, T>

// Outbound
export type Outbound = Discriminated<ItemOf<Config['outbounds']>>
export type OutboundOf<T extends Outbound['type']> = ByType<Outbound, T>

// Endpoint
export type Endpoint =
  | Discriminated<ItemOf<Config['endpoints']>>
  | (openconnect<string, string, string> & { type: 'openconnect' })
export type EndpointOf<T extends Endpoint['type']> = ByType<Endpoint, T>

// Service
export type Service = ItemOf<Config['services']>
export type ServiceOf<T extends Service['type']> = ByType<Service, T>

// Certificate Provider
export type CertificateProvider = ItemOf<Config['certificate_providers']>
export type CertificateProviderOf<T extends CertificateProvider['type']> = ByType<
  CertificateProvider,
  T
>

// Network Namespace
export type NetworkNamespace = ItemOf<Config['network_namespaces']>
export type NetworkNamespaceOf<T extends NonNullable<NetworkNamespace['type']>> = ByType<
  NetworkNamespace,
  T
>

export type SingBoxConfig = Config
