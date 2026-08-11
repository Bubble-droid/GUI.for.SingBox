import type { Directive } from 'vue'

import { useAppStore } from '@/stores'
import { debounce } from '@/utils'

interface TipsElement extends HTMLElement {
  _tipsValue?: string
}

export default {
  mounted(el: TipsElement, binding) {
    const appStore = useAppStore()
    el._tipsValue = binding.value

    const delay = binding.modifiers['fast'] ? 200 : 500

    const show = debounce((x: number, y: number) => {
      if (el.dataset['showTips'] === 'true') {
        appStore.tipsPosition = { x, y }
        appStore.tipsMessage = el._tipsValue || ''
        appStore.tipsShow = true
      }
    }, delay)

    el.onmouseenter = (e) => {
      if (el._tipsValue) {
        el.dataset['showTips'] = 'true'
        void show(e.clientX, e.clientY)
      }
    }

    el.onmouseleave = () => {
      appStore.tipsShow = false
      el.dataset['showTips'] = 'false'
    }
  },
  updated(el: TipsElement, binding) {
    el._tipsValue = binding.value
  },
  beforeUnmount(el: TipsElement) {
    const appStore = useAppStore()
    appStore.tipsShow = false
    el.dataset['showTips'] = 'false'
    el.onmouseenter = null
    el.onmouseleave = null
  },
} satisfies Directive<HTMLElement, string>
