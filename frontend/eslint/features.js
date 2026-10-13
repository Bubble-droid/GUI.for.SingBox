/**
 * Stricter ESLint rules for the fork-owned `src/features/**` extension layer.
 *
 * Kept outside `src/` so the application source tree stays free of tooling
 * config. Oxlint uses the nested `src/features/.oxlintrc.json` for its own
 * per-directory rules.
 *
 * @type {import('eslint').Linter.Config}
 */
export const featuresStrictRules = {
  name: 'features/strict-rules',
  files: ['src/features/**/*.{ts,vue}'],
  rules: {
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
    'vue/define-macros-order': [
      'error',
      {
        order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
        defineExposeLast: true,
      },
    ],
    'vue/component-api-style': ['error', ['script-setup', 'composition']],
    'vue/no-duplicate-class-names': 'error',
  },
}
