import { onUnmounted } from 'vue'

import { EventsOn, WindowHide } from '@/bridge'
import * as Stores from '@/stores'
import { exitApp, message, modal } from '@/utils'

import CommandView from '@/components/_common/CommandView.vue'

export const handleLaunchApp = async (args: string[]) => {
  const links = args.filter((arg) => arg.includes('://'))

  const subscribesStore = Stores.useSubscribesStore()
  for (const link of links) {
    try {
      await subscribesStore.importSubscribe(link)
      message.success('common.success')
    } catch (error) {
      message.error(error)
    }
  }
}

export const useAppLifecycle = () => {
  const appStore = Stores.useAppStore()
  const appSettings = Stores.useAppSettingsStore()
  let commandModal: ReturnType<typeof modal> | undefined

  const offLaunchApp = EventsOn('onLaunchApp', handleLaunchApp)

  const offBeforeExitApp = EventsOn('onBeforeExitApp', async () => {
    if (appSettings.app.exitOnClose) {
      exitApp()
      return
    }

    WindowHide()
  })

  const offExitApp = EventsOn('onExitApp', () => exitApp())

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
      m.setContent(CommandView, { close: () => m.close() }).open()
      return
    }

    if (event.key === 'Escape') {
      const closeFn = appStore.modalStack.at(-1)
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
