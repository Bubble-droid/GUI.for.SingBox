import type { MessageSchema } from '../types'

export const log = {
  disabled: 'Disabled',
  level: 'Level',
  output: 'Output',
  timestamp: 'Timestamp',
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
  panic: 'panic',
} satisfies MessageSchema['log']
