import { vueTsConfigs } from '@vue/eslint-config-typescript'

/** @type {Parameters<typeof import('@vue/eslint-config-typescript')['withVueTs']>[1]} */
export const featuresStrictConfig = {
  name: 'features/strict-rules',
  files: ['src/features/**/*.{ts,vue}'],
  extends: [vueTsConfigs.strictTypeChecked, vueTsConfigs.stylisticTypeChecked],
  rules: {
    'vue/no-v-html': 'error',
    'vue/define-macros-order': [
      'error',
      {
        order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
        defineExposeLast: true,
      },
    ],
    'vue/component-api-style': ['error', ['script-setup', 'composition']],
    'vue/no-duplicate-class-names': 'error',

    'no-empty-function': 'off',

    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/member-ordering': 'error',
  },
}
