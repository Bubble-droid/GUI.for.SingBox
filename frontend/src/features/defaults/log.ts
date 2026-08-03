import { LogLevel } from '@features/constant/kernel'
import type { LogConfig } from '@profiles/log'

export const createLog = (): LogConfig => ({
  disabled: false,
  level: LogLevel.Info,
  output: '',
  timestamp: false,
})
