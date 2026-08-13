import { ref } from 'vue'

import { IsStartup } from '@/bridge/app'

import { useAppStore } from '@/stores/app'
import { useAppSettingsStore } from '@/stores/appSettings'
import { registerStoreDeps } from '@/stores/deps'
import { useEnvStore } from '@/stores/env'
import { useKernelApiStore } from '@/stores/kernelApi'
import { useLogsStore } from '@/stores/logs'
import { usePluginsStore } from '@/stores/plugins'
import { useProfilesStore } from '@/stores/profiles'
import { useRulesetsStore } from '@/stores/rulesets'
import { useScheduledTasksStore } from '@/stores/scheduledtasks'
import { useSubscribesStore } from '@/stores/subscribes'
import { message } from '@/utils/interaction'
import { sleep } from '@/utils/others'

const MIN_SPLASH_DURATION = 1000

export const useAppBootstrap = () => {
  const loading = ref(true)
  const percent = ref(0)
  const hasError = ref(false)

  registerStoreDeps({
    appStore: () => useAppStore(),
    appSettingsStore: () => useAppSettingsStore(),
    envStore: () => useEnvStore(),
    kernelApiStore: () => useKernelApiStore(),
    logsStore: () => useLogsStore(),
    pluginsStore: () => usePluginsStore(),
    profilesStore: () => useProfilesStore(),
    rulesetsStore: () => useRulesetsStore(),
    scheduledTasksStore: () => useScheduledTasksStore(),
    subscribesStore: () => useSubscribesStore(),
  })

  const envStore = useEnvStore()
  const appSettings = useAppSettingsStore()
  const profilesStore = useProfilesStore()
  const subscribesStore = useSubscribesStore()
  const rulesetsStore = useRulesetsStore()
  const pluginsStore = usePluginsStore()
  const scheduledTasksStore = useScheduledTasksStore()
  const kernelApiStore = useKernelApiStore()

  const showError = (error: unknown) => {
    hasError.value = true
    message.error(error)
  }

  const initialize = async () => {
    await envStore.setupEnv()

    await Promise.all([
      appSettings.setupAppSettings(),
      subscribesStore.setupSubscribes(),
      rulesetsStore.setupRulesets(),
      pluginsStore.setupPlugins(),
      scheduledTasksStore.setupScheduledTasks(),
    ])

    await profilesStore.setupProfiles()

    const startTime = performance.now()
    percent.value = 20

    if (await IsStartup()) {
      await pluginsStore.onStartupTrigger().catch(showError)
    }

    percent.value = 40
    await pluginsStore.onReadyTrigger().catch(showError)

    const duration = performance.now() - startTime
    percent.value = duration < 500 ? 80 : 100

    await sleep(Math.max(0, MIN_SPLASH_DURATION - duration))

    loading.value = false
    void kernelApiStore.initCoreState()
  }

  initialize().catch(showError)

  return {
    loading,
    percent,
    hasError,
  }
}
