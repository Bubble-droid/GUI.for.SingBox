import type { Directive, DirectiveBinding } from 'vue'

import { useAppStore } from '@/stores'
import { sleep } from '@/utils'

const updateMenus = (el: HTMLElement, binding: DirectiveBinding<App.Menu[]>) => {
  const appStore = useAppStore()

  el.oncontextmenu = async (e) => {
    e.preventDefault()
    if (binding.value.length) {
      appStore.menuPosition = { x: e.clientX, y: e.clientY }
      appStore.menuList = binding.value
      if (appStore.menuShow) {
        appStore.menuShow = false
        await sleep(200)
      }
      appStore.menuShow = true
    }
  }
}

export default {
  mounted(el, binding) {
    updateMenus(el, binding)
  },
  updated(el, binding) {
    updateMenus(el, binding)
  },
  unmounted(el) {
    el.oncontextmenu = null
  },
} satisfies Directive<HTMLElement, App.Menu[]>
