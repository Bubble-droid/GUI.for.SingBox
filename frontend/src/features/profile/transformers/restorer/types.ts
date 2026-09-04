import type { Profile } from '@profile/types/profiles'

import type { useSubscribesStore } from '@/stores/subscribes'
import type { AppEnv, AppRuleSet } from '@/types/app'

export interface RestoreOptions {
  profile?: Profile
  subscriptionIds?: string[]
}

export interface IdMaps {
  certProviders: Map<string, string>
  httpClients: Map<string, string>
  netns: Map<string, string>
  endpoints: Map<string, string>
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}

export interface RestoreContext {
  appEnv: AppEnv
  getSubscribe: ReturnType<typeof useSubscribesStore>['getSubscribeById']
  getRuleSetByPath: (path: string) => AppRuleSet | undefined
}
