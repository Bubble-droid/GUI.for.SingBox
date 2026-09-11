// oxlint-disable import/no-nodejs-modules
import { vueTsConfigs } from '@vue/eslint-config-typescript';
import path from 'node:path';

/** @type {Parameters<typeof import('@vue/eslint-config-typescript')['withVueTs']>[1]} */
export const featuresStrictConfig = {
  name: 'features/strict-rules',
  files: ['src/features/**/*.{ts,vue}'],
  extends: [
    vueTsConfigs.recommendedTypeChecked,
    vueTsConfigs.stylisticTypeChecked,
  ],

  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: path.resolve(import.meta.dirname, '../../'),
      extraFileExtensions: ['.vue'],
    },
  },

  rules: {
    'vue/define-macros-order': [
      'error',
      {
        order: [
          'defineOptions',
          'defineModel',
          'defineProps',
          'defineEmits',
          'defineSlots',
        ],
        defineExposeLast: true,
      },
    ],
    'vue/component-api-style': ['error', ['script-setup', 'composition']],
    'vue/no-duplicate-class-names': 'error',

    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/member-ordering': 'error',
  },
};
