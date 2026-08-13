interface AppPage {
  path: string
  name: string
  label: string
  icon: string
  hidden?: false
}

export const appPages = [
  {
    path: '/',
    name: 'Overview',
    label: 'router.overview',
    icon: 'overview',
  },
  {
    path: '/profiles',
    name: 'Profiles',
    label: 'router.profiles',
    icon: 'profiles',
  },
  {
    path: '/subscriptions',
    name: 'Subscriptions',
    label: 'router.subscriptions',
    icon: 'subscriptions',
  },
  {
    path: '/rulesets',
    name: 'Rulesets',
    label: 'router.rulesets',
    icon: 'rulesets',
  },
  {
    path: '/plugins',
    name: 'Plugins',
    label: 'router.plugins',
    icon: 'plugins',
  },
  {
    path: '/scheduledtasks',
    name: 'ScheduledTasks',
    label: 'router.scheduledtasks',
    icon: 'scheduledTasks',
  },
  {
    path: '/settings',
    name: 'Settings',
    label: 'router.settings',
    icon: 'settings2',
    hidden: false,
  },
] as const satisfies AppPage[]
