import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from 'eslint-config-prettier/flat'
import pluginOxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'

export default withVueTs(
  {
    scriptLangs: ['ts'],
    rootDir: import.meta.dirname,
  },

  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,vue}'],
  },

  globalIgnores(['**/dist/**', '**/wailsjs/**']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  vueTsConfigs.stylistic,

  skipFormatting,

  pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  {
    rules: {
      '@typescript-eslint/no-explicit-any': ['off'],
      'vue/no-v-html': ['off'],
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['index'],
        },
      ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
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
)
