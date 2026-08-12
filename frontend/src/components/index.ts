import type { Plugin, App, Component } from 'vue'

import { Modal } from '@/components/Modal'

const Components = import.meta.glob<Component>(['./*/index.vue', '!./Modal/index.vue'], {
  eager: true,
  import: 'default',
})

export default {
  install: (app: App) => {
    Object.entries(Components).forEach(([path, comp]) => {
      const name = (path.split('/') as [string, string])[1]
      app.component(name, comp)
    })

    // eslint-disable-next-line vue/multi-word-component-names
    app.component('Modal', Modal)
  },
} as Plugin
