import {
  createDomainResolver,
  createDialer,
  createUdpNat,
  createListen,
  createInboundTls,
  createOutboundTls,
  createHttp2Options,
  createQuicOptions,
  createDns01Challenge,
} from '@defaults/shared'
import { RouteRuleType, DnsRuleType } from '@features/constant/kernel'
import type {
  SingBoxDomainResolver,
  SingBoxDialer,
  SingBoxUdpNat,
  SingBoxListen,
  SingBoxInboundTls,
  SingBoxOutboundTls,
  SingBoxHttp2,
  SingBoxQuic,
  SingBoxDns01Challenge,
} from '@features/types/sing-box'
import { splitProps, normalizeArray } from '@features/utils/helper'
import type {
  DomainResolver,
  Dialer,
  UdpNat,
  Listen,
  InboundTlsConfig,
  OutboundTlsConfig,
  Http2Options,
  QuicOptions,
  Dns01Challenge,
} from '@profiles/shared'

import type { IdMaps } from './types'

export const supportedRuleTypes = [
  RouteRuleType.Inbound,
  RouteRuleType.Network,
  RouteRuleType.Protocol,
  RouteRuleType.Domain,
  RouteRuleType.DomainSuffix,
  RouteRuleType.DomainKeyword,
  RouteRuleType.DomainRegex,
  RouteRuleType.SourceIPCidr,
  RouteRuleType.IpCidr,
  RouteRuleType.SourcePort,
  RouteRuleType.SourcePortRange,
  RouteRuleType.Port,
  RouteRuleType.PortRange,
  RouteRuleType.ProcessName,
  RouteRuleType.ProcessPath,
  RouteRuleType.ProcessPathRegex,
  RouteRuleType.RuleSet,
  RouteRuleType.IpIsPrivate,
  RouteRuleType.ClashMode,
  DnsRuleType.IpAcceptAny,
]

export const restoreDomainResolver = (
  raw: SingBoxDomainResolver | string | undefined,
  maps: IdMaps,
): DomainResolver => {
  const template = createDomainResolver()
  const normalizedResolver = raw
    ? typeof raw === 'string'
      ? { ...template, server: raw }
      : splitProps(raw, template).target
    : template
  const resolver: DomainResolver = {
    ...template,
    ...normalizedResolver,
    server: maps.dnsServers.get(normalizedResolver.server) ?? '',
  }
  return resolver
}

export const restoreDialer = <T extends object>(
  raw: T,
  maps: IdMaps,
): { dialer: Dialer; rest: Omit<T, keyof Dialer> } => {
  const template = createDialer()
  const result = splitProps(raw, template)
  const target = result.target as SingBoxDialer
  const resolver = restoreDomainResolver(target.domain_resolver, maps)
  const dialer: Dialer = {
    ...template,
    ...target,
    network_type: normalizeArray(target.network_type),
    fallback_network_type: normalizeArray(target.fallback_network_type),
    netns: maps.netns.get(target.netns ?? '') ?? '',
    detour: maps.outbounds.get(target.detour ?? '') ?? '',
    domain_resolver: resolver,
  }
  return { dialer, rest: result.rest }
}

export const restoreUdpNat = <T extends object>(
  raw: T,
): { udpNat: UdpNat; rest: Omit<T, keyof UdpNat> } => {
  const template = createUdpNat()
  const result = splitProps(raw, template)
  const target = result.target as SingBoxUdpNat
  const udpNat = {
    ...template,
    ...target,
  } as UdpNat
  return { udpNat, rest: result.rest }
}

export const restoreListen = <T extends object>(
  raw: T,
  maps: IdMaps,
): { listen: Listen; rest: Omit<T, keyof Listen> } => {
  const template = createListen()
  const result = splitProps(raw, template)
  const target = result.target as unknown as SingBoxListen
  const listen: Listen = {
    ...template,
    ...target,
    netns: maps.netns.get(target.netns ?? '') ?? '',
    detour: maps.inbounds.get(target.detour ?? '') ?? '',
  }
  return { listen, rest: result.rest }
}

export const restoreInboundTls = (
  raw: SingBoxInboundTls | undefined,
  maps: IdMaps,
): InboundTlsConfig => {
  const template = createInboundTls()
  if (!raw) return template

  const { dialer, rest: handshakeRest } = restoreDialer(raw.reality?.handshake ?? {}, maps)

  return {
    ...template,
    ...raw,
    enabled: raw.enabled ?? true,
    alpn: normalizeArray(raw.alpn),
    cipher_suites: normalizeArray(raw.cipher_suites),
    curve_preferences: normalizeArray(raw.curve_preferences),
    certificate: normalizeArray(raw.certificate),
    client_certificate: normalizeArray(raw.client_certificate),
    client_certificate_path: normalizeArray(raw.client_certificate_path),
    client_certificate_public_key_sha256: normalizeArray(raw.client_certificate_public_key_sha256),
    key: normalizeArray(raw.key),
    certificate_provider: maps.certProviders.get(raw.certificate_provider as string) ?? '',
    ech: {
      ...template.ech,
      ...raw.ech,
      key: normalizeArray(raw.ech?.key),
    },
    reality: {
      ...template.reality,
      ...raw.reality,
      handshake: {
        ...template.reality.handshake,
        ...handshakeRest,
        dialer,
      },
    },
  }
}

export const restoreOutboundTls = (raw: SingBoxOutboundTls | undefined): OutboundTlsConfig => {
  const template = createOutboundTls()
  if (!raw) return template

  return {
    ...template,
    ...raw,
    enabled: raw.enabled ?? true,
    alpn: normalizeArray(raw.alpn),
    cipher_suites: normalizeArray(raw.cipher_suites),
    curve_preferences: normalizeArray(raw.curve_preferences),
    certificate: normalizeArray(raw.certificate),
    certificate_public_key_sha256: normalizeArray(raw.certificate_public_key_sha256),
    client_certificate: normalizeArray(raw.client_certificate),
    client_key: normalizeArray(raw.client_key),
    ech: {
      ...template.ech,
      ...raw.ech,
      config: normalizeArray(raw.ech?.config),
    },
    utls: {
      ...template.utls,
      ...raw.utls,
    },
    reality: {
      ...template.reality,
      ...raw.reality,
    },
  }
}

export const restoreHttp2Options = <T extends Record<string, unknown>>(
  raw: T,
): { http2: Http2Options; rest: Omit<T, keyof Http2Options> } => {
  const template = createHttp2Options()
  const result = splitProps(raw, template)
  const target = result.target as SingBoxHttp2
  const http2: Http2Options = {
    ...template,
    ...target,
  }
  return { http2, rest: result.rest }
}

export const restoreQuicOptions = <T extends Record<string, unknown>>(
  raw: T,
): { quic: QuicOptions; rest: Omit<T, keyof QuicOptions> } => {
  const template = createQuicOptions()
  const result = splitProps(raw, template)
  const target = result.target as SingBoxQuic
  const quic: QuicOptions = {
    ...template,
    ...target,
  }
  return { quic, rest: result.rest }
}

export const restoreDns01Challenge = (
  raw: SingBoxDns01Challenge | undefined,
  maps: IdMaps,
): Dns01Challenge => {
  const template = createDns01Challenge(raw?.provider)
  if (!raw) return template

  return {
    ...template,
    ...raw,
    resolvers: normalizeArray((raw as Dns01Challenge).resolvers)
      .map((v) => maps.dnsServers.get(v))
      .filter(Boolean) as string[],
  } as Dns01Challenge
}
