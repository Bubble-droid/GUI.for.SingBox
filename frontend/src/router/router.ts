import type { IconName } from '@/components/Icon/icons'

declare module 'vue-router' {
  interface RouteMeta {
    name: string
    icon?: IconName
    hidden?: boolean
  }
}
