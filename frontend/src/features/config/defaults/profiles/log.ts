import { LogLevel } from '@/enums'

import type { LogConfig } from '@/features/config/types'

export const createDefaultLog = (): LogConfig => ({
  disabled: false,
  level: LogLevel.Info,
  output: '',
  timestamp: false,
})
