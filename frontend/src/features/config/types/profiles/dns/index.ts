import type { DomainStrategy } from '@/features/config/constant'

import type { DnsRuleConfig } from './rules'
import type { DnsServerConfig } from './servers'

export type * from './servers'
export type * from './rules'

export interface DnsConfig {
  servers: DnsServerConfig[]
  rules: DnsRuleConfig[]
  disable_cache: boolean
  disable_expire: boolean
  independent_cache: boolean
  client_subnet: string
  final: string
  strategy: DomainStrategy
}
