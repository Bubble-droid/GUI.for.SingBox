/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { featuresZhMessage } from './i18n'

type FeaturesMessage = typeof featuresZhMessage

// Augments the upstream locale typing with fork-only feature messages without
// touching `src/lang/i18n.d.ts`, which upstream owns.
declare module 'vue-i18n' {
  interface DefineLocaleMessage extends FeaturesMessage {}
}
