import i18n from '@/lang'

const FeaturesMessages = {
  zh: {
    about: { updatesManagedByOS: '更新由您的操作系统管理' },
  },
  en: {
    about: { updatesManagedByOS: 'Updates are managed by your operating system' },
  },
} as const

export const mergeFeaturesMessage = () => {
  for (const [key, msg] of Object.entries(FeaturesMessages)) {
    i18n.global.mergeLocaleMessage(key, msg)
  }
}
