// oxlint-disable import/no-unassigned-import
import { defineConfig } from 'golar/unstable'

import '@golar/vue'

export default defineConfig({
  typecheck: {
    include: ['env.d.ts', 'src/**/*.{ts,vue}'],
  },
})
