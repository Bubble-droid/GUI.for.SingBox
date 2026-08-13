import type { useAppStore } from './app'
import type { useAppSettingsStore } from './appSettings'
import type { useEnvStore } from './env'
import type { useKernelApiStore } from './kernelApi'
import type { useLogsStore } from './logs'
import type { usePluginsStore } from './plugins'
import type { useProfilesStore } from './profiles'
import type { useRulesetsStore } from './rulesets'
import type { useScheduledTasksStore } from './scheduledtasks'
import type { useSubscribesStore } from './subscribes'

export interface StoreDeps {
  appStore: ReturnType<typeof useAppStore>
  appSettingsStore: ReturnType<typeof useAppSettingsStore>
  envStore: ReturnType<typeof useEnvStore>
  kernelApiStore: ReturnType<typeof useKernelApiStore>
  logsStore: ReturnType<typeof useLogsStore>
  pluginsStore: ReturnType<typeof usePluginsStore>
  profilesStore: ReturnType<typeof useProfilesStore>
  rulesetsStore: ReturnType<typeof useRulesetsStore>
  scheduledTasksStore: ReturnType<typeof useScheduledTasksStore>
  subscribesStore: ReturnType<typeof useSubscribesStore>
}

type StoreDepsProvider = { [K in keyof StoreDeps]: () => StoreDeps[K] }

const providers: Partial<StoreDepsProvider> = {}

export const registerStoreDeps = (deps: StoreDepsProvider) => {
  Object.assign(providers, deps)
}

export const useStoreDeps = <K extends keyof StoreDeps>(key: K): StoreDeps[K] => {
  const provider = providers[key]
  if (!provider) throw `Store dependency '${key}' has not been injected yet`
  return provider()
}
