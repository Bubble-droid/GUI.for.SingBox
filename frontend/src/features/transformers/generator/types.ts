import type { usePluginsStore } from '@/stores/plugins'
import type { useRulesetsStore } from '@/stores/rulesets'
import type { useSubscribesStore } from '@/stores/subscribes'

export interface GenerateConfigOptions {
  enableStableConfigCompat?: boolean
  enablePluginProcessing?: boolean
  enableMixinProcessing?: boolean
  enableScriptProcessing?: boolean
}

export interface TagMaps {
  certProviders: Map<string, string>
  httpClients: Map<string, string>
  netns: Map<string, string>
  endpoints: Map<string, string>
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}

export interface GenerateContext {
  appSettings: App.AppSettings
  appEnv: App.AppEnv
  onGenerate: ReturnType<typeof usePluginsStore>['onGenerateTrigger']
  getSubscribe: ReturnType<typeof useSubscribesStore>['getSubscribeById']
  getRuleSet: ReturnType<typeof useRulesetsStore>['getRulesetById']
}
