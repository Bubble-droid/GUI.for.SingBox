import type { RouteRuleType } from '@profile/constant/kernel'

export interface OptionItem<T extends string | number | boolean = string> {
  readonly label: string
  readonly value: T
  readonly desc?: string
}

type RuleKind =
  | typeof RouteRuleType.IpCidr
  | typeof RouteRuleType.Domain
  | typeof RouteRuleType.DomainSuffix
  | typeof RouteRuleType.ProcessPath

export type RuleCandidate = Partial<Record<RuleKind, string>>
