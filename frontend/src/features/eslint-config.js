import { vueTsConfigs } from '@vue/eslint-config-typescript'

/** @type {Parameters<typeof import('@vue/eslint-config-typescript')['withVueTs']>[1]} */
export const featuresStrictConfig = {
  name: 'features/strict-rules',
  files: ['src/features/**/*.{ts,vue}'],
  extends: [vueTsConfigs.strict, vueTsConfigs.stylistic],

  rules: {
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    'vue/define-macros-order': [
      'error',
      {
        order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
        defineExposeLast: true,
      },
    ],
    'vue/component-api-style': ['error', ['script-setup', 'composition']],
    'vue/no-duplicate-class-names': 'error',

    '@typescript-eslint/member-ordering': 'error',
  },
}
