import { createNtp } from '@defaults/ntp'
import type { SingBoxNtp } from '@features/types/sing-box'
import type { NtpConfig } from '@profiles/ntp'

import { restoreDialer } from './shared'
import type { IdMaps } from './types'

export const restoreNtp = (raw: SingBoxNtp | undefined, maps: IdMaps): NtpConfig => {
  const template = createNtp()
  if (!raw) return template
  const { dialer, rest } = restoreDialer(raw, maps)
  return {
    ...template,
    ...rest,
    dialer,
  }
}
