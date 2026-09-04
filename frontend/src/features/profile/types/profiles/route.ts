import type {
  RuleSetType,
  RuleSetFormat,
  RouteRuleType,
  DomainStrategy,
  RouteActionKind,
} from '@profile/constant/kernel'

import type { TagItem } from './shared'

export interface RuleSetItem extends TagItem {
  type: RuleSetType
  // inline
  rules: string
  // local
  path: string
  // remote
  url: string
  download_detour: string
  update_interval: string
  // local or remote
  format: RuleSetFormat
}

export interface RouteRuleItem {
  id: string
  type: RouteRuleType
  enable: boolean
  payload: string
  invert: boolean
  action: RouteActionKind
  // action = route
  outbound: string
  // action = sniff
  sniffer: string[]
  // action = resolve
  strategy: DomainStrategy
  server: string
}

export interface RouteSection {
  rules: RouteRuleItem[]
  rule_set: RuleSetItem[]
  final: string
  auto_detect_interface: boolean
  default_interface: string
  find_process: boolean
  default_domain_resolver: {
    server: string
    client_subnet: string
  }
}
