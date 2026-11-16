import { onUnmounted } from 'vue'

import { EventsOn, WindowHide } from '@/bridge'
import { OS } from '@/enums/app'
import * as Stores from '@/stores'
import { exitApp, message, modal } from '@/utils'

import CommandView from '@/components/_common/CommandView.vue'

const valueFlags = new Set(['--data-dir', '--window-start-state'])

const fileUrlToPath = (link: string) => {
  const url = new URL(link)
  let path = decodeURIComponent(url.pathname)
  if (url.hostname) {
    path = `//${url.hostname}${path}`
  }
  if (Stores.useEnvStore().env.os === OS.Windows) {
    path = path.replace(/^\/(?=[A-Za-z]:)/, '')
  }
  return path
}

const splitLaunchArgs = (args: string[]) => {
  const links: string[] = []
  const paths: string[] = []

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg) continue

    if (arg.startsWith('-')) {
      if (!arg.includes('=') && valueFlags.has(arg)) i++
      continue
    }

    if (arg.startsWith('file://')) {
      const path = fileUrlToPath(arg)
      if (path.toLowerCase().endsWith('.json')) {
        paths.push(path)
      }
    } else if (arg.includes('://')) {
      links.push(arg)
    } else if (arg.toLowerCase().endsWith('.json')) {
      paths.push(arg)
    }
  }

  return { links, paths }
}

export const handleLaunchApp = async (args: string[]) => {
  const { links, paths } = splitLaunchArgs(args)

  const subscribesStore = Stores.useSubscribesStore()
  for (const link of links) {
    try {
      await subscribesStore.importSubscribe(link)
      message.success('common.success')
    } catch (error) {
      message.error(error)
    }
  }

  const profilesStore = Stores.useProfilesStore()
  for (const path of paths) {
    try {
      await profilesStore.importProfile(path)
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
