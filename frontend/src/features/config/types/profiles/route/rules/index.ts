import type { DomainStrategy, RouteRuleAction, RouteRuleType } from '@/features/config/constant'

export interface RouteRuleConfig {
  id: string
  type: RouteRuleType
  enable: boolean
  payload: string
  invert: boolean
  action: RouteRuleAction
  // action = route
  outbound: string
  // action = sniff
  sniffer: string[]
  // action = resolve
  strategy: DomainStrategy
  server: string
}
