import type { Profile } from '@profiles'

import type { Branch } from '@/enums/app'

export interface GenerateConfigOptions {
  enableStableConfigCompat?: boolean
  enablePluginProcessing?: boolean
  enableMixinProcessing?: boolean
  enableScriptProcessing?: boolean
}

export interface TagMaps {
  certProviders: Map<string, string>
  httpClients: Map<string, string>
  endpoints: Map<string, string>
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}

export interface GenerateContext {
  branch: Branch
  appDataPath: string
  onGenerate: (config: Recordable<any>, profile: Profile) => Promise<Recordable<any>>
  getSubscribe: (id: string) => App.Subscription | undefined
  getRuleSet: (id: string) => App.RuleSet | undefined
}
