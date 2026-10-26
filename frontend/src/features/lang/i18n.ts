import i18n from '@/lang'

export const featuresZhMessage = {
  about: { updatesManagedByOS: '更新由您的操作系统管理' },
} as const

export const mergeFeaturesMessage = () => {
  i18n.global.mergeLocaleMessage('zh', featuresZhMessage)

  i18n.global.mergeLocaleMessage('en', {
    about: { updatesManagedByOS: 'Updates are managed by your operating system' },
  })
}
