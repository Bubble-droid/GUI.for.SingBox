// oxlint-disable unicorn/consistent-function-scoping
import { Cron } from 'croner'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { parse } from 'yaml'

import { Notify } from '@/bridge/app'
import { ReadFile, WriteFile } from '@/bridge/io'

import { ScheduledTasksFilePath, ScheduledTasksType, PluginTriggerEvent } from '@/constant/app'
import { ignoredError, stringifyNoFolding } from '@/utils/others'

import { StoreDep, useStoreDeps } from './deps'

export const useScheduledTasksStore = defineStore('scheduledtasks', () => {
  const scheduledtasks = ref<App.ScheduledTask[]>([])
  const cronJobsMap: Recordable<Cron> = {}

  const setupScheduledTasks = async () => {
    const data = await ignoredError(ReadFile, ScheduledTasksFilePath)
    data && (scheduledtasks.value = parse(data))

    scheduledtasks.value.forEach(({ disabled, cron, id }) => {
      if (!disabled) {
        cronJobsMap[id] = new Cron(cron, () => {
          void runScheduledTask(id)
        })
      }
    })
  }

  const runScheduledTask = async (id: string) => {
    const task = getScheduledTaskById(id)
    if (!task) {
      return undefined
    }

    const logsStore = useStoreDeps(StoreDep.LogsStore)

    task.lastTime = Date.now()

    const startTime = Date.now()
    const result = await getTaskFn(task)()

    if (task.notification) {
      const successes = result.filter((v) => v.ok).length
      const failures = result.length - successes
      const details = result.flatMap((v) => v.result).join('\n')
      const content = `Successes: ${successes}; Failures: ${failures}. \n\n${details}`
      void Notify(task.name, content)
    }

    const log = {
      name: task.name,
      startTime,
      endTime: Date.now(),
      result,
    }

    logsStore.recordScheduledTasksLog(log)

    await editScheduledTask(id, task)

    return log
  }

  const withOutput = <T>(list: string[], fn: (id: string) => Promise<T>) => {
    return async () => {
      const output: { ok: boolean; result: T }[] = []
      for (const id of list) {
        try {
          const result = await fn(id)
          if (Array.isArray(result)) {
            output.push(...result)
          } else {
            output.push({ ok: true, result })
          }
        } catch (error: any) {
          output.push({ ok: false, result: error.message || error })
        }
      }
      return output
    }
  }

  const getTaskFn = (task: App.ScheduledTask) => {
    switch (task.type) {
      case ScheduledTasksType.UpdateSubscription: {
        const subscribesStore = useStoreDeps(StoreDep.SubscribesStore)
        return withOutput(task.subscriptions, subscribesStore.updateSubscribe)
      }
      case ScheduledTasksType.UpdateRuleset: {
        const rulesetsStore = useStoreDeps(StoreDep.RulesetsStore)
        return withOutput(task.rulesets, rulesetsStore.updateRuleset)
      }
      case ScheduledTasksType.UpdatePlugin: {
        const pluginsStores = useStoreDeps(StoreDep.PluginsStore)
        return withOutput(task.plugins, pluginsStores.updatePlugin)
      }
      case ScheduledTasksType.UpdateAllSubscription: {
        const subscribesStore = useStoreDeps(StoreDep.SubscribesStore)
        return withOutput(['0'], () => subscribesStore.updateSubscribes())
      }
      case ScheduledTasksType.UpdateAllRuleset: {
        const rulesetsStore = useStoreDeps(StoreDep.RulesetsStore)
        return withOutput(['1'], () => rulesetsStore.updateRulesets())
      }
      case ScheduledTasksType.UpdateAllPlugin: {
        const pluginsStores = useStoreDeps(StoreDep.PluginsStore)
        return withOutput(['2'], () => pluginsStores.updatePlugins())
      }
      case ScheduledTasksType.RunPlugin: {
        const pluginsStores = useStoreDeps(StoreDep.PluginsStore)
        return withOutput(task.plugins, async (id: string) =>
          pluginsStores.manualTrigger(id, PluginTriggerEvent.OnTask),
        )
      }
      case ScheduledTasksType.RunScript: {
        return withOutput([task.script], (script: string) => new globalThis.AsyncFunction(script)())
      }
      default: {
        throw new Error(`Unknown scheduled task type: ${String(task.type)}`)
      }
    }
  }

  const saveScheduledTasks = () => {
    return WriteFile(ScheduledTasksFilePath, stringifyNoFolding(scheduledtasks.value))
  }

  const addScheduledTask = async (s: App.ScheduledTask) => {
    scheduledtasks.value.push(s)
    try {
      cronJobsMap[s.id] = new Cron(s.cron, () => {
        void runScheduledTask(s.id)
      })
      await saveScheduledTasks()
    } catch (error) {
      cronJobsMap[s.id]?.stop()
      delete cronJobsMap[s.id]
      const idx = scheduledtasks.value.indexOf(s)
      if (idx !== -1) {
        scheduledtasks.value.splice(idx, 1)
      }
      throw error
    }
  }

  const deleteScheduledTask = async (id: string) => {
    const idx = scheduledtasks.value.findIndex((v) => v.id === id)
    if (idx === -1) {
      return
    }
    const backup = scheduledtasks.value.splice(idx, 1)[0]!
    try {
      await saveScheduledTasks()
      cronJobsMap[id]?.stop()
      delete cronJobsMap[id]
    } catch (error) {
      scheduledtasks.value.splice(idx, 0, backup)
      throw error
    }
  }

  const editScheduledTask = async (id: string, s: App.ScheduledTask) => {
    const idx = scheduledtasks.value.findIndex((v) => v.id === id)
    if (idx === -1) {
      return
    }
    const backup = scheduledtasks.value.splice(idx, 1, s)[0]!
    try {
      await saveScheduledTasks()
      cronJobsMap[id]?.stop()
      if (s.disabled) {
        delete cronJobsMap[id]
      } else {
        cronJobsMap[id] = new Cron(s.cron, () => {
          void runScheduledTask(id)
        })
      }
    } catch (error) {
      scheduledtasks.value.splice(idx, 1, backup)
      throw error
    }
  }

  const getScheduledTaskById = (id: string) => scheduledtasks.value.find((v) => v.id === id)

  return {
    scheduledtasks,
    setupScheduledTasks,
    saveScheduledTasks,
    addScheduledTask,
    editScheduledTask,
    deleteScheduledTask,
    getScheduledTaskById,
    getTaskFn,
    runScheduledTask,
  }
})
