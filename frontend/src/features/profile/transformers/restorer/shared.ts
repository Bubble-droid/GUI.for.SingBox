import { RouteRuleType, DnsRuleType } from '@profile/constant/kernel'
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
} from '@profile/defaults/shared'
import type {
  DialerForm,
  Dns01ChallengeForm,
  DomainResolverForm,
  Http2Form,
  InboundTlsForm,
  ListenForm,
  OutboundTlsForm,
  OutboundUtls,
  QuicForm,
  UdpNatForm,
} from '@profile/types/profiles/shared'
import type {
  DialerOptions,
  Dns01ChallengeOptions,
  DomainResolverOptions,
  Http2Options,
  InboundTlsOptions,
  ListenOptions,
  OutboundTlsOptions,
  QuicOptions,
  UdpNatOptions,
} from '@profile/types/sing-box/shared'
import { normalizeArray, splitProps } from '@profile/utils/helper'

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
  maps: IdMaps,
  raw?: DomainResolverOptions | string,
): DomainResolverForm => {
  const template = createDomainResolver()
  const normalizedResolver = raw
    ? typeof raw === 'string'
      ? { ...template, server: raw }
      : splitProps(raw, template).target
    : template
  const resolver: DomainResolverForm = {
    ...template,
    ...normalizedResolver,
    server: maps.dnsServers.get(normalizedResolver.server) ?? '',
  }
  return resolver
}

export const restoreDialer = <T extends object>(
  raw: T,
  maps: IdMaps,
): { dialer: DialerForm; rest: Omit<T, keyof DialerForm> } => {
  const template = createDialer()
  const result = splitProps(raw, template)
  const target = result.target as DialerOptions
  const resolver = restoreDomainResolver(maps, target.domain_resolver)
  const dialer: DialerForm = {
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
): { udpNat: UdpNatForm; rest: Omit<T, keyof UdpNatForm> } => {
  const template = createUdpNat()
  const result = splitProps(raw, template)
  const target = result.target as UdpNatOptions
  const udpNat = {
    ...template,
    ...target,
  }
  return { udpNat, rest: result.rest }
}

export const restoreListen = <T extends object>(
  raw: T,
  maps: IdMaps,
): { listen: ListenForm; rest: Omit<T, keyof ListenForm> } => {
  const template = createListen()
  const result = splitProps(raw, template)
  const target = result.target as unknown as ListenOptions
  const listen: ListenForm = {
    ...template,
    ...target,
    netns: maps.netns.get(target.netns ?? '') ?? '',
    detour: maps.inbounds.get(target.detour ?? '') ?? '',
  }
  return { listen, rest: result.rest }
}

export const restoreInboundTls = (maps: IdMaps, raw?: InboundTlsOptions): InboundTlsForm => {
  const template = createInboundTls()
  if (!raw) {
    return template
  }

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
      short_id: normalizeArray(raw.reality?.short_id),
    },
  }
}

export const restoreOutboundTls = (raw?: OutboundTlsOptions): OutboundTlsForm => {
  const template = createOutboundTls()
  if (!raw) {
    return template
  }

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
    } as OutboundUtls,
    reality: {
      ...template.reality,
      ...raw.reality,
      short_id: normalizeArray(raw.reality?.short_id),
    },
  }
}

export const restoreHttp2Options = <T extends Record<string, unknown>>(
  raw: T,
): { http2: Http2Form; rest: Omit<T, keyof Http2Form> } => {
  const template = createHttp2Options()
  const result = splitProps(raw, template)
  const target = result.target as Http2Options
  const http2: Http2Form = {
    ...template,
    ...target,
  }
  return { http2, rest: result.rest }
}

export const restoreQuicOptions = <T extends Record<string, unknown>>(
  raw: T,
): { quic: QuicForm; rest: Omit<T, keyof QuicForm> } => {
  const template = createQuicOptions()
  const result = splitProps(raw, template)
  const target = result.target as QuicOptions
  const quic: QuicForm = {
    ...template,
    ...target,
  }
  return { quic, rest: result.rest }
}

export const restoreDns01Challenge = (
  maps: IdMaps,
  raw?: Dns01ChallengeOptions,
): Dns01ChallengeForm => {
  const template = createDns01Challenge(raw?.provider)
  if (!raw) {
    return template
  }

  return {
    ...template,
    ...raw,
    resolvers: normalizeArray(raw.resolvers)
      .map((v) => maps.dnsServers.get(v))
      .filter(Boolean) as string[],
  } as Dns01ChallengeForm
}
