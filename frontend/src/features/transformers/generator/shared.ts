import { RouteRuleType, DnsRuleType } from '@features/constant/kernel'
import type { SingBoxDomainResolver, SingBoxDialer, SingBoxUdpNat } from '@features/types/sing-box'
import { filterInvalidProps } from '@features/utils/helper'
import type { DnsRuleConfig } from '@profiles/dns'
import type { InboundConfig } from '@profiles/inbounds'
import type { RouteRuleConfig, RuleSetConfig } from '@profiles/route'
import type { DomainResolver, Dialer, UdpNat } from '@profiles/shared'

import { deepAssign } from '@/utils'

import type { TagMaps } from './types'

export const generateDomainResolver = (
  resolver: DomainResolver,
  maps: TagMaps,
): SingBoxDomainResolver => {
  return filterInvalidProps({
    ...(resolver as SingBoxDomainResolver),
    server: maps.dnsServers.get(resolver.server)!,
  })
}

export const generateDialer = (dialer: Dialer, maps: TagMaps): SingBoxDialer => {
  return {
    ...(dialer as SingBoxDialer),
    detour: maps.outbounds.get(dialer.detour)!,
    domain_resolver: generateDomainResolver(dialer.domain_resolver, maps),
  }
}

export const generateUdpNat = (udpNat: UdpNat): SingBoxUdpNat => {
  return { ...(udpNat as SingBoxUdpNat) }
}

export const _generateRule = (
  rule: RouteRuleConfig | DnsRuleConfig,
  rule_set: RuleSetConfig[],
  inbounds: InboundConfig[],
) => {
  const getInbound = (id: string) => inbounds.find((v) => v.id === id)?.tag
  const getRuleset = (id: string) => rule_set.find((v) => v.id === id)?.tag

  const extra: Recordable = { action: rule.action, invert: rule.invert ? true : undefined }
  if (rule.type === RouteRuleType.Inline) {
    deepAssign(extra, JSON.parse(rule.payload))
  } else if (rule.type === RouteRuleType.RuleSet) {
    extra[rule.type] = rule.payload.split(',').map((id) => getRuleset(id))
  } else if (rule.type === RouteRuleType.Inbound) {
    extra[rule.type] = getInbound(rule.payload)
  } else if ([RouteRuleType.IpIsPrivate, DnsRuleType.IpAcceptAny].includes(rule.type as any)) {
    extra[rule.type] = rule.payload === 'true'
  } else if (rule.type === RouteRuleType.ClashMode) {
    extra[rule.type] = rule.payload
  } else {
    extra[rule.type] = String(rule.payload)
      .split(',')
      .map((val) => {
        if ([RouteRuleType.Port, RouteRuleType.SourcePort].includes(rule.type as any)) {
          return Number(val)
        }
        return val
      })
    if (extra[rule.type].length === 1) {
      extra[rule.type] = extra[rule.type][0]
    }
  }
  return extra
}
