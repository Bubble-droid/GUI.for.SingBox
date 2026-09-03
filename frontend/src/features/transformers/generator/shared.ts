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
import type { DnsRuleConfig } from '@profiles/dns'
import type { InboundConfig } from '@profiles/inbounds'
import type { RouteRuleConfig, RuleSetConfig } from '@profiles/route'
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

import { deepAssign } from '@/utils/others'

import type { Recordable } from '@/types/typescript'

import type { TagMaps } from './types'

export const generateDomainResolver = (
  resolver: DomainResolver,
  maps: TagMaps,
): SingBoxDomainResolver => ({
  ...(resolver as SingBoxDomainResolver),
  server: maps.dnsServers.get(resolver.server) ?? '',
})

export const generateDialer = (dialer: Dialer, maps: TagMaps): SingBoxDialer => ({
  ...(dialer as SingBoxDialer),
  netns: maps.netns.get(dialer.netns) ?? '',
  detour: maps.outbounds.get(dialer.detour) ?? '',
  domain_resolver: generateDomainResolver(dialer.domain_resolver, maps),
})

export const generateUdpNat = (udpNat: UdpNat): SingBoxUdpNat => ({ ...(udpNat as SingBoxUdpNat) })

export const generateListen = (listen: Listen, maps: TagMaps): SingBoxListen => ({
  ...(listen as SingBoxListen),
  netns: maps.netns.get(listen.netns) ?? '',
  detour: maps.inbounds.get(listen.detour) ?? '',
})

export const generateRule = (
  rule: RouteRuleConfig | DnsRuleConfig,
  rule_set: RuleSetConfig[],
  inbounds: InboundConfig[],
) => {
  const getInbound = (id: string) => inbounds.find((v) => v.id === id)?.tag
  const getRuleset = (id: string) => rule_set.find((v) => v.id === id)?.tag

  const extra: Recordable = { action: rule.action, invert: rule.invert ? true : undefined }
  switch (rule.type) {
    case RouteRuleType.Inline: {
      deepAssign(extra, JSON.parse(rule.payload))
      break
    }
    case RouteRuleType.RuleSet: {
      extra[rule.type] = rule.payload.split(',').map((id) => getRuleset(id))
      break
    }
    case RouteRuleType.Inbound: {
      extra[rule.type] = getInbound(rule.payload)
      break
    }
    case DnsRuleType.IpIsPrivate:
    case DnsRuleType.IpAcceptAny: {
      extra[rule.type] = rule.payload === 'true'
      break
    }
    case RouteRuleType.ClashMode: {
      extra[rule.type] = rule.payload
      break
    }
    default: {
      extra[rule.type] = rule.payload.split(',').map((val) => {
        if (rule.type === RouteRuleType.Port || rule.type === RouteRuleType.SourcePort) {
          return Number(val)
        }
        return val
      })
      const value = extra[rule.type] as unknown[]
      if (value.length === 1) {
        extra[rule.type] = value[0]
      }
      break
    }
  }
  return extra
}

export const generateInboundTls = (
  tls: InboundTlsConfig,
  maps: TagMaps,
): SingBoxInboundTls | undefined => {
  if (!tls.enabled) {
    return undefined
  }
  const { enabled: _, ech, reality, ...rest } = tls
  return {
    ...rest,
    enabled: true,
    ech: ech.enabled ? { ...ech } : undefined,
    reality: reality.enabled
      ? {
          ...reality,
          handshake: {
            server: reality.handshake.server,
            server_port: reality.handshake.server_port,
            ...generateDialer(reality.handshake.dialer, maps),
          },
        }
      : undefined,
    certificate_provider: maps.certProviders.get(rest.certificate_provider),
  } as SingBoxInboundTls
}

export const generateOutboundTls = (tls: OutboundTlsConfig): SingBoxOutboundTls | undefined => {
  if (!tls.enabled) {
    return undefined
  }
  const { enabled: _, ech, utls, reality, ...rest } = tls
  return {
    ...rest,
    enabled: true,
    ech: ech.enabled ? { ...ech } : undefined,
    utls: utls.enabled ? { ...utls } : undefined,
    reality: reality.enabled ? { ...reality } : undefined,
  } as SingBoxOutboundTls
}

export const generateHttp2Options = (http2: Http2Options): SingBoxHttp2 =>
  ({ ...http2 }) as SingBoxHttp2

export const generateQuicOptions = (quic: QuicOptions): SingBoxQuic => {
  const { initial_packet_size, disable_path_mtu_discovery, ...rest } = quic
  return {
    ...generateHttp2Options(rest),
    initial_packet_size,
    disable_path_mtu_discovery,
  }
}

export const generateDns01Challenge = (
  dns01: Dns01Challenge,
  maps: TagMaps,
): SingBoxDns01Challenge =>
  ({
    ...dns01,
    resolvers: dns01.resolvers.map((v) => maps.dnsServers.get(v)),
  }) as unknown as SingBoxDns01Challenge
