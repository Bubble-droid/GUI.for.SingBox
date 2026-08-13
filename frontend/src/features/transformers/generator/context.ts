import type { GenerateContext } from '@generator/types'

import { useStoreDeps } from '@/stores/deps'

export const getGenerateContext = (): GenerateContext => {
  const appSettingsStore = useStoreDeps('appSettingsStore')
  const envStore = useStoreDeps('envStore')
  const pluginsStore = useStoreDeps('pluginsStore')
  const subscribesStore = useStoreDeps('subscribesStore')
  const ruleSetStore = useStoreDeps('rulesetsStore')

  return {
    appSettings: appSettingsStore.app,
    appEnv: envStore.env,
    onGenerate: pluginsStore.onGenerateTrigger,
    getSubscribe: (id: string) => subscribesStore.getSubscribeById(id),
    getRuleSet: (id: string) => ruleSetStore.getRulesetById(id),
  }
}
