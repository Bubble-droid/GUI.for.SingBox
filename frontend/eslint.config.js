import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettierConfig from 'eslint-config-prettier'
import pluginOxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'

import { featuresStrictConfig } from './src/features/eslint-config.js'

export default withVueTs(
  {
    scriptLangs: ['ts'],
    rootDir: import.meta.dirname,
  },

  {
    ignores: ['**/dist/**', '**/wailsjs/**'],
  },

  {
    name: 'app/base-rules',
    files: ['**/*.{ts,vue}'],
    extends: [pluginVue.configs['flat/recommended'], vueTsConfigs.recommended],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': ['off'],
      'vue/no-v-html': ['off'],
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['index'],
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  featuresStrictConfig,

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
  ...pluginOxlint.buildFromOxlintConfigFile('./src/features/.oxlintrc.json'),

  prettierConfig,
)
