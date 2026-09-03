import type { Directive, DirectiveBinding } from 'vue'

import { useAppStore } from '@/stores/app'
import { sleep } from '@/utils/others'

import type * as App from '@/types/app'

const menuHandlers = new WeakMap<HTMLElement, (e: MouseEvent) => void>()

const updateMenus = (el: HTMLElement, binding: DirectiveBinding<App.Menu[]>) => {
  const appStore = useAppStore()

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    void (async () => {
      if (binding.value.length > 0) {
        appStore.menuPosition = { x: e.clientX, y: e.clientY }
        appStore.menuList = binding.value
        if (appStore.menuShow) {
          appStore.menuShow = false
          await sleep(200)
        }
        appStore.menuShow = true
      }
    })()
  }

  const previous = menuHandlers.get(el)
  if (previous) {
    el.removeEventListener('contextmenu', previous)
  }
  el.addEventListener('contextmenu', onContextMenu)
  menuHandlers.set(el, onContextMenu)
}

export default {
  mounted(el, binding) {
    updateMenus(el, binding)
  },
  updated(el, binding) {
    updateMenus(el, binding)
  },
  unmounted(el) {
    const handler = menuHandlers.get(el)
    if (handler) {
      el.removeEventListener('contextmenu', handler)
    }
    menuHandlers.delete(el)
  },
} satisfies Directive<HTMLElement, App.Menu[]>
