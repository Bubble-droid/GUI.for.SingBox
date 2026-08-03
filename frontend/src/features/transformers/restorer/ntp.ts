import { createNtp } from '@defaults/ntp'
import type { SingBoxNtp } from '@features/types/sing-box'
import type { NtpConfig } from '@profiles/ntp'

import { restoreDialer } from './shared'
import type { IdMaps } from './types'

export const restoreNtp = (raw: SingBoxNtp, maps: IdMaps): NtpConfig => {
  const template = createNtp()
  const { dialer, rest } = restoreDialer(raw ?? {}, maps)
  return {
    ...template,
    ...rest,
    dialer,
  }
}
