import type { Profile } from '@profile/types/profiles'
import type { RuleSet } from '@profile/types/sing-box/route'

import type { Subscription, ScheduledTask, AppRuleSet, AppPlugin } from '@/types/app'

export type ResourceType = 'profile' | 'subscription' | 'ruleset' | 'plugin' | 'scheduledtask'
export type ResourceItem = Profile | Subscription | RuleSet | AppPlugin | ScheduledTask

export type ResourceItemMap<T extends ResourceType> = Pick<ResourceResultMap, ResourceType>[T]

export interface ResourceSelectProps<T extends ResourceType> {
  type: T
  title?: string | undefined
  cols?: number
  max?: number
  min?: number
  renderSlot?: boolean
  openImmediate?: boolean
}

export interface ResourceResultMap {
  profile: Profile
  subscription: Subscription
  ruleset: AppRuleSet
  plugin: AppPlugin
  scheduledtask: ScheduledTask
  1: Profile
  2: Subscription
  3: RuleSet
  4: AppPlugin
  5: ScheduledTask
}

export type ResourceSelectType = keyof ResourceResultMap

export const ResourceTypeMap = {
  profile: 'profile',
  subscription: 'subscription',
  ruleset: 'ruleset',
  plugin: 'plugin',
  scheduledtask: 'scheduledtask',
  1: 'profile',
  2: 'subscription',
  3: 'ruleset',
  4: 'plugin',
  5: 'scheduledtask',
} as const

export type ResourceTypeOf<T extends ResourceSelectType> = (typeof ResourceTypeMap)[T]
