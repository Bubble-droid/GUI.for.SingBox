import type { RouteRecordRaw } from 'vue-router'

import HomeView from '@/views/HomeView/index.vue'
import PluginsView from '@/views/PluginsView/index.vue'
import ProfilesView from '@/views/ProfilesView/index.vue'
import RulesetsView from '@/views/RulesetsView/index.vue'
import ScheduledTasksView from '@/views/ScheduledTasksView/index.vue'
import SettingsView from '@/views/SettingsView/index.vue'
import SubscribesView from '@/views/SubscribesView/index.vue'

import { appPages } from './pages'

const viewMap = {
  Overview: HomeView,
  Profiles: ProfilesView,
  Subscriptions: SubscribesView,
  Rulesets: RulesetsView,
  Plugins: PluginsView,
  ScheduledTasks: ScheduledTasksView,
  Settings: SettingsView,
} as const

const routes: RouteRecordRaw[] = appPages.map((page) => ({
  path: page.path,
  name: page.name,
  component: viewMap[page.name]!,
  meta: {
    name: page.label,
    icon: page.icon,
    ...('hidden' in page ? { hidden: page.hidden } : {}),
  },
}))

export default routes
