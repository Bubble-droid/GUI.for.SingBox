import { onUnmounted } from 'vue'

import { EventsOn, WindowHide } from '@wails/runtime/runtime'

import { useAppSettingsStore } from '@/stores/appSettings'
import { useProfilesStore } from '@/stores/profiles'
import { useSubscribesStore } from '@/stores/subscribes'
import { exitApp } from '@/utils/helper'
import { modal, message } from '@/utils/interaction'
import { isValidUrl } from '@/utils/is'

import CommandView from '@/components/_common/CommandView.vue'
import { modalStack } from '@/components/Modal/state'

export const useAppLifecycle = () => {
  const appSettings = useAppSettingsStore()
  const profilesStore = useProfilesStore()
  const subscribesStore = useSubscribesStore()
  let commandModal: ReturnType<typeof modal> | undefined

  const offLaunchApp = EventsOn('onLaunchApp', async (...args: string[]) => {
    if (!args.length) return

    for (const arg of args.flat()) {
      if (!arg) {
        continue
      }
      try {
        if (isValidUrl(arg)) {
          await subscribesStore.importSubscribe(arg)
        } else {
          await profilesStore.importProfile(arg)
        }
        message.success('common.success')
      } catch (error) {
        console.error(`Import failed for "${arg}"`, error)
        message.error(error)
      }
    }
  })

  const offBeforeExitApp = EventsOn('onBeforeExitApp', () => {
    if (appSettings.app.exitOnClose) {
      void exitApp()
      return
    }

    WindowHide()
  })

  const offExitApp = EventsOn('onExitApp', () => {
    void exitApp()
  })

  const handleKeydown = (event: KeyboardEvent) => {
    if (((event.ctrlKey && event.shiftKey) || event.metaKey) && event.code === 'KeyP') {
      event.preventDefault()
      if (event.repeat || commandModal) return

      const m = modal({
        title: 'commands.title',
        maskClosable: true,
        height: '90',
        px: 0,
        py: 0,
        submit: false,
        toolbar: {
          maximize: false,
          minimize: false,
        },
        afterDestroy() {
          commandModal = undefined
        },
      })
      commandModal = m
      m.setContent(CommandView, {
        close: () => {
          m.close()
        },
      }).open()
      return
    }

    if (event.key === 'Escape') {
      const closeFn = modalStack.at(-1)
      closeFn?.()
    }
  }

  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    offLaunchApp()
    offBeforeExitApp()
    offExitApp()
    window.removeEventListener('keydown', handleKeydown)
  })
}
