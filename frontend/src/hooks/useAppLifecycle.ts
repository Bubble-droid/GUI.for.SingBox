import { onUnmounted } from 'vue'

import { EventsOn, WindowHide } from '@/bridge'
import * as Stores from '@/stores'
import { exitApp, message, sampleID } from '@/utils'

export const useAppLifecycle = () => {
  const appStore = Stores.useAppStore()
  const appSettings = Stores.useAppSettingsStore()
  const subscribesStore = Stores.useSubscribesStore()

  const offLaunchApp = EventsOn('onLaunchApp', async (args: string[]) => {
    const firstArg = args[0]?.trim()
    if (!firstArg) return

    if (['quit', '--quit', '-q'].includes(firstArg.toLowerCase())) {
      exitApp()
      return
    }

    try {
      const url = new URL(firstArg)

      const isProfileImport =
        url.hostname === 'import-remote-profile' ||
        url.pathname === '//install-config/' ||
        url.pathname.startsWith('//import-remote-profile')

      if (!isProfileImport) return

      const subUrl = url.searchParams.get('url')
      if (!subUrl) {
        message.error('Subscription URL missing')
        return
      }

      const subName =
        url.searchParams.get('name') || decodeURIComponent(url.hash).slice(1) || sampleID()

      await subscribesStore.importSubscribe(subName, subUrl)
      message.success('common.success')
    } catch (error) {
      message.error(error)
    }
  })

  const offBeforeExitApp = EventsOn('onBeforeExitApp', async () => {
    if (appSettings.app.exitOnClose) {
      exitApp()
      return
    }

    WindowHide()
  })

  const offExitApp = EventsOn('onExitApp', () => exitApp())

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return

    const closeFn = appStore.modalStack.at(-1)
    closeFn?.()
  }

  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    offLaunchApp()
    offBeforeExitApp()
    offExitApp()
    window.removeEventListener('keydown', handleKeydown)
  })
}
