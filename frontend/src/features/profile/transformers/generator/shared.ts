import { RouteRuleType, DnsRuleType } from '@profile/constant/kernel'
import type { DnsRuleItem } from '@profile/types/profiles/dns'
import type { InboundItem } from '@profile/types/profiles/inbound'
import type { RouteRuleItem, RuleSetItem } from '@profile/types/profiles/route'
import type {
  DialerFormData,
  Dns01ChallengeFormData,
  DomainResolverFormData,
  Http2FormData,
  InboundTlsFormData,
  ListenFormData,
  OutboundTlsFormData,
  QuicFormData,
  UdpNatFormData,
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

import { deepAssign } from '@/utils/others'

import type { Recordable } from '@/types/typescript'

import type { TagMaps } from './types'

export const generateDomainResolver = (
  resolver: DomainResolverFormData,
  maps: TagMaps,
): DomainResolverOptions => ({
  ...(resolver as DomainResolverOptions),
  server: maps.dnsServers.get(resolver.server) ?? '',
})

export const generateDialer = (dialer: DialerFormData, maps: TagMaps): DialerOptions => ({
  ...(dialer as DialerOptions),
  netns: maps.netns.get(dialer.netns) ?? '',
  detour: maps.outbounds.get(dialer.detour) ?? '',
  domain_resolver: generateDomainResolver(dialer.domain_resolver, maps),
})

export const generateUdpNat = (udpNat: UdpNatFormData): UdpNatOptions => ({
  ...(udpNat as UdpNatOptions),
})

export const generateListen = (listen: ListenFormData, maps: TagMaps): ListenOptions => ({
  ...(listen as ListenOptions),
  netns: maps.netns.get(listen.netns) ?? '',
  detour: maps.inbounds.get(listen.detour) ?? '',
})

export const generateInboundTls = (
  tls: InboundTlsFormData,
  maps: TagMaps,
): InboundTlsOptions | undefined => {
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
  } as InboundTlsOptions
}

export const generateOutboundTls = (tls: OutboundTlsFormData): OutboundTlsOptions | undefined => {
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
  } as OutboundTlsOptions
}

export const generateHttp2Options = (http2: Http2FormData): Http2Options => ({
  ...(http2 as Http2Options),
})

export const generateQuicOptions = (quic: QuicFormData): QuicOptions => {
  const { initial_packet_size, disable_path_mtu_discovery, ...rest } = quic
  return {
    ...generateHttp2Options(rest),
    initial_packet_size,
    disable_path_mtu_discovery,
  }
}

export const generateDns01Challenge = (
  dns01: Dns01ChallengeFormData,
  maps: TagMaps,
): Dns01ChallengeOptions => ({
  ...(dns01 as Dns01ChallengeOptions),
  resolvers: dns01.resolvers.map((v) => maps.dnsServers.get(v) ?? ''),
})

export const generateRuleItem = (
  rule: RouteRuleItem | DnsRuleItem,
  rule_set: RuleSetItem[],
  inbounds: InboundItem[],
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
