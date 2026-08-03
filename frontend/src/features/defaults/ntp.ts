import type { NtpConfig } from '@profiles/ntp'

import { createDialer } from './shared'

export const createNtp = (): NtpConfig => ({
  enabled: false,
  server: '',
  server_port: 123,
  interval: '',
  dialer: createDialer(),
})
