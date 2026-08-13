import type { GenerateContext } from '@generator/types'

import { useAppSettingsStore } from '@/stores/appSettings'
import { useEnvStore } from '@/stores/env'
import { usePluginsStore } from '@/stores/plugins'
import { useRulesetsStore } from '@/stores/rulesets'
import { useSubscribesStore } from '@/stores/subscribes'

export const getGenerateContext = (): GenerateContext => {
  const appSettingsStore = useAppSettingsStore()
  const envStore = useEnvStore()
  const pluginsStore = usePluginsStore()
  const subscribesStore = useSubscribesStore()
  const ruleSetStore = useRulesetsStore()

  return {
    branch: appSettingsStore.app.kernel.branch,
    appDataPath: envStore.env.appDataPath,
    onGenerate: pluginsStore.onGenerateTrigger,
    getSubscribe: (id: string) => subscribesStore.getSubscribeById(id),
    getRuleSet: (id: string) => ruleSetStore.getRulesetById(id),
  }
}
