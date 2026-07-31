import type { LogLevel } from '@/features/config/constant'

export interface LogConfig {
  disabled: boolean
  level: LogLevel
  output: string
  timestamp: boolean
}
