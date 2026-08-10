import type { Directive, DirectiveBinding } from 'vue'

import { useEnvStore } from '@/stores'

const updateVisibility = (el: HTMLElement, binding: DirectiveBinding<App.OS[]>) => {
  const envStore = useEnvStore()
  const supports = binding.value
  el.style.display = supports.includes(envStore.env.os) ? '' : 'none'
}

export default {
  mounted(el, binding) {
    updateVisibility(el, binding)
  },
  updated(el, binding) {
    updateVisibility(el, binding)
  },
} satisfies Directive<HTMLElement, App.OS[]>
