import { LogLevel } from '@/enums'

export const DefaultLog = (): App.Log => ({
  disabled: false,
  level: LogLevel.Info,
  output: '',
  timestamp: false,
})
