import { useStoreDeps } from '@/stores/deps'

import type { RestoreContext } from './types'

export const getRestoreContext = (): RestoreContext => {
  const envStore = useStoreDeps('envStore')
  const subscribesStore = useStoreDeps('subscribesStore')
  const ruleSetStore = useStoreDeps('rulesetsStore')

  return {
    appEnv: envStore.env,
    getSubscribe: (id: string) => subscribesStore.getSubscribeById(id),
    getRuleSetByPath: (path: string) => ruleSetStore.rulesets.find((v) => v.path === path),
  }
}
