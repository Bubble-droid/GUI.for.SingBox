import type { MessageSchema } from '../types'

export const log = {
  disabled: 'Disable Log',
  output: 'Log Output Path',
  timestamp: 'Show Timestamp',
  level: {
    title: 'Default Log Level',
    trace: 'trace',
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
    fatal: 'fatal',
    panic: 'panic',
  },
} satisfies MessageSchema['log']
