import type { Profile } from '@profiles'

export type ResourceType = 'profile' | 'subscription' | 'ruleset' | 'plugin' | 'scheduledtask'
export type ResourceItem = Profile | App.Subscription | App.RuleSet | App.Plugin | App.ScheduledTask

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
  subscription: App.Subscription
  ruleset: App.RuleSet
  plugin: App.Plugin
  scheduledtask: App.ScheduledTask
  1: Profile
  2: App.Subscription
  3: App.RuleSet
  4: App.Plugin
  5: App.ScheduledTask
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
