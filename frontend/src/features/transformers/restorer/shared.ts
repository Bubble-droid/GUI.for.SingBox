import {
  createDomainResolver,
  createDialer,
  createUdpNat,
  createListen,
  createInboundTls,
  createOutboundTls,
} from '@defaults/shared'
import { RouteRuleType, DnsRuleType } from '@features/constant/kernel'
import type {
  SingBoxDomainResolver,
  SingBoxDialer,
  SingBoxUdpNat,
  SingBoxListen,
  SingBoxInboundTls,
  SingBoxOutboundTls,
} from '@features/types/sing-box'
import { extractProps, ensureArray } from '@features/utils/helper'
import type {
  DomainResolver,
  Dialer,
  UdpNat,
  Listen,
  InboundTlsConfig,
  OutboundTlsConfig,
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
  const normalizedResolver = !raw
    ? template
    : typeof raw === 'string'
      ? { ...template, server: raw }
      : extractProps(raw, template).owned
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
  const result = extractProps(raw, template)
  const owned = result.owned as SingBoxDialer
  const resolver = restoreDomainResolver(owned.domain_resolver, maps)
  const dialer: Dialer = {
    ...template,
    ...owned,
    network_type: ensureArray(owned.network_type),
    fallback_network_type: ensureArray(owned.fallback_network_type),
    detour: maps.outbounds.get(owned.detour!) ?? '',
    domain_resolver: resolver,
  }
  return { dialer, rest: result.rest }
}

export const restoreUdpNat = <T extends object>(
  raw: T,
): { udpNat: UdpNat; rest: Omit<T, keyof UdpNat> } => {
  const template = createUdpNat()
  const result = extractProps(raw, template)
  const owned = result.owned as SingBoxUdpNat
  const udpNat = {
    ...template,
    ...owned,
  } as UdpNat
  return { udpNat, rest: result.rest }
}

export const restoreListen = <T extends object>(
  raw: T,
  maps: IdMaps,
): { listen: Listen; rest: Omit<T, keyof Listen> } => {
  const template = createListen()
  const result = extractProps(raw, template)
  const owned = result.owned as unknown as SingBoxListen
  const listen: Listen = {
    ...template,
    ...owned,
    detour: maps.inbounds.get(owned.detour!) ?? '',
  }
  return { listen, rest: result.rest }
}

export const restoreInboundTls = (raw: SingBoxInboundTls, maps: IdMaps): InboundTlsConfig => {
  const template = createInboundTls()
  if (!raw) return template

  const { dialer, rest: handshakeRest } = restoreDialer(raw.reality?.handshake ?? {}, maps)

  return {
    ...template,
    ...raw,
    enabled: raw.enabled ?? true,
    alpn: ensureArray(raw.alpn),
    cipher_suites: ensureArray(raw.cipher_suites),
    curve_preferences: ensureArray(raw.curve_preferences),
    certificate: ensureArray(raw.certificate),
    client_certificate: ensureArray(raw.client_certificate),
    client_certificate_path: ensureArray(raw.client_certificate_path),
    client_certificate_public_key_sha256: ensureArray(raw.client_certificate_public_key_sha256),
    key: ensureArray(raw.key),
    certificate_provider: maps.certProviders.get(raw.certificate_provider as string) ?? '',
    ech: {
      ...template.ech,
      ...raw.ech,
      key: ensureArray(raw.ech?.key),
    },
    reality: {
      ...template.reality,
      ...raw.reality,
      short_id: ensureArray(raw.reality?.short_id),
      handshake: {
        ...template.reality.handshake,
        ...handshakeRest,
        dialer,
      },
    },
  }
}

export const restoreOutboundTls = (raw: SingBoxOutboundTls): OutboundTlsConfig => {
  const template = createOutboundTls()
  if (!raw) return template

  return {
    ...template,
    ...raw,
    enabled: raw.enabled ?? true,
    alpn: ensureArray(raw.alpn),
    cipher_suites: ensureArray(raw.cipher_suites),
    curve_preferences: ensureArray(raw.curve_preferences),
    certificate: ensureArray(raw.certificate),
    certificate_public_key_sha256: ensureArray(raw.certificate_public_key_sha256),
    client_certificate: ensureArray(raw.client_certificate),
    client_key: ensureArray(raw.client_key),
    ech: {
      ...template.ech,
      ...raw.ech,
      config: ensureArray(raw.ech?.config),
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
