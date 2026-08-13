import { StoreDep, useStoreDeps } from '@/stores/deps'

import type { RestoreContext } from './types'

export const getRestoreContext = (): RestoreContext => {
  const envStore = useStoreDeps(StoreDep.EnvStore)
  const subscribesStore = useStoreDeps(StoreDep.SubscribesStore)
  const ruleSetStore = useStoreDeps(StoreDep.RulesetsStore)

  return {
    appEnv: envStore.env,
    getSubscribe: (id: string) => subscribesStore.getSubscribeById(id),
    getRuleSetByPath: (path: string) => ruleSetStore.rulesets.find((v) => v.path === path),
  }
}
