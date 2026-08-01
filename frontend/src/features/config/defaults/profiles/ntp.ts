import type { NtpConfig } from '@/features/config/types'

import { createDefaultDialer } from './shared'

export const createDefaultNtp = (): NtpConfig => ({
  enabled: false,
  server: '',
  server_port: 123,
  interval: '',
  dialer: createDefaultDialer(),
})
