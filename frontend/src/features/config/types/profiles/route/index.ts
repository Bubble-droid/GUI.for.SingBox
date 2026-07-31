import type { RuleSetConfig } from './rule-set'
import type { RouteRuleConfig } from './rules'

export type * from './rule-set'
export type * from './rules'

export interface RouteConfig {
  rules: RouteRuleConfig[]
  rule_set: RuleSetConfig[]
  final: string
  auto_detect_interface: boolean
  default_interface: string
  find_process: boolean
  default_domain_resolver: {
    server: string
    client_subnet: string
  }
}
