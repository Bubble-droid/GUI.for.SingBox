import type { ValueOf } from '@/types/utils'

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

export const StoreDep = {
  AppStore: 'appStore',
  AppSettingsStore: 'appSettingsStore',
  EnvStore: 'envStore',
  KernelApiStore: 'kernelApiStore',
  LogsStore: 'logsStore',
  PluginsStore: 'pluginsStore',
  ProfilesStore: 'profilesStore',
  RulesetsStore: 'rulesetsStore',
  ScheduledTasksStore: 'scheduledTasksStore',
  SubscribesStore: 'subscribesStore',
} as const

type StoreDep = ValueOf<typeof StoreDep>

export interface StoreDeps {
  [StoreDep.AppStore]: ReturnType<typeof useAppStore>
  [StoreDep.AppSettingsStore]: ReturnType<typeof useAppSettingsStore>
  [StoreDep.EnvStore]: ReturnType<typeof useEnvStore>
  [StoreDep.KernelApiStore]: ReturnType<typeof useKernelApiStore>
  [StoreDep.LogsStore]: ReturnType<typeof useLogsStore>
  [StoreDep.PluginsStore]: ReturnType<typeof usePluginsStore>
  [StoreDep.ProfilesStore]: ReturnType<typeof useProfilesStore>
  [StoreDep.RulesetsStore]: ReturnType<typeof useRulesetsStore>
  [StoreDep.ScheduledTasksStore]: ReturnType<typeof useScheduledTasksStore>
  [StoreDep.SubscribesStore]: ReturnType<typeof useSubscribesStore>
}

type StoreDepsProvider = { [K in StoreDep]: () => StoreDeps[K] }

const createStoreDeps = () => {
  const providers: Partial<StoreDepsProvider> = {}

  const registerStoreDeps = (deps: StoreDepsProvider) => {
    Object.assign(providers, deps)
  }

  const useStoreDeps = <K extends StoreDep>(key: K): StoreDeps[K] => {
    const provider = providers[key]
    if (!provider) throw `Store dependency '${key}' has not been injected yet`
    return provider()
  }

  return { registerStoreDeps, useStoreDeps }
}

export const { registerStoreDeps, useStoreDeps } = createStoreDeps()
