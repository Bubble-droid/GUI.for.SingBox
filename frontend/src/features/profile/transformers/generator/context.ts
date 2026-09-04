import type { GenerateContext } from '@profile/transformers/generator/types'

import { StoreDep, useStoreDeps } from '@/stores/deps'

export const getGenerateContext = (): GenerateContext => {
  const appSettingsStore = useStoreDeps(StoreDep.AppSettingsStore)
  const envStore = useStoreDeps(StoreDep.EnvStore)
  const pluginsStore = useStoreDeps(StoreDep.PluginsStore)
  const subscribesStore = useStoreDeps(StoreDep.SubscribesStore)
  const ruleSetStore = useStoreDeps(StoreDep.RulesetsStore)

  return {
    appSettings: appSettingsStore.app,
    appEnv: envStore.env,
    onGenerate: pluginsStore.onGenerateTrigger,
    getSubscribe: subscribesStore.getSubscribeById,
    getRuleSet: ruleSetStore.getRulesetById,
  }
}
