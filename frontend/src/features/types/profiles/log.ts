import type { LogLevel } from '@features/constant/kernel'

export interface LogConfig {
  disabled: boolean
  level: LogLevel
  output: string
  timestamp: boolean
}
