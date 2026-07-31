import type { DnsRuleAction, DnsRuleType, DomainStrategy } from '@/features/config/constant'

export interface DnsRuleConfig {
  id: string
  type: DnsRuleType
  enable: boolean
  payload: string
  action: DnsRuleAction
  invert: boolean
  // route
  server: string
  strategy: DomainStrategy
  // route/route-options
  disable_cache: boolean
  client_subnet: string
}
