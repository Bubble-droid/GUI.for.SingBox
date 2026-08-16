import type { RouteRuleType } from '@features/constant/kernel'

export interface ComponentOption<T = string> {
  readonly label: string
  readonly value: T
}

type Candidate =
  | typeof RouteRuleType.IpCidr
  | typeof RouteRuleType.Domain
  | typeof RouteRuleType.DomainSuffix
  | typeof RouteRuleType.ProcessPath

export type RuleCandidate = Partial<Record<Candidate, string>>
