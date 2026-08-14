import type { Directive } from 'vue'

import { useAppStore } from '@/stores/app'
import { debounce } from '@/utils/others'

interface TipsElement extends HTMLElement {
  _tipsValue?: string
}

const tipsHandlers = new WeakMap<
  TipsElement,
  { onMouseEnter: (e: MouseEvent) => void; onMouseLeave: () => void }
>()

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

    const onMouseEnter = (e: MouseEvent) => {
      if (el._tipsValue) {
        el.dataset['showTips'] = 'true'
        void show(e.clientX, e.clientY)
      }
    }

    const onMouseLeave = () => {
      appStore.tipsShow = false
      el.dataset['showTips'] = 'false'
    }

    el.addEventListener('mouseenter', onMouseEnter)
    el.addEventListener('mouseleave', onMouseLeave)
    tipsHandlers.set(el, { onMouseEnter, onMouseLeave })
  },
  updated(el: TipsElement, binding) {
    el._tipsValue = binding.value
  },
  beforeUnmount(el: TipsElement) {
    const appStore = useAppStore()
    appStore.tipsShow = false
    el.dataset['showTips'] = 'false'
    const handlers = tipsHandlers.get(el)
    if (handlers) {
      el.removeEventListener('mouseenter', handlers.onMouseEnter)
      el.removeEventListener('mouseleave', handlers.onMouseLeave)
    }
    tipsHandlers.delete(el)
  },
} satisfies Directive<HTMLElement, string>
