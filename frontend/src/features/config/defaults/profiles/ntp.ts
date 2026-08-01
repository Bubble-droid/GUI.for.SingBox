import type { NtpConfig } from '@/features/config/types'

import { createDialer } from './shared'

export const createNtp = (): NtpConfig => ({
  enabled: false,
  server: '',
  server_port: 123,
  interval: '',
  dialer: createDialer(),
})
