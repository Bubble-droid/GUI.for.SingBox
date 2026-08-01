import { createNtp } from '@/constant'

import type { NtpConfig, SingBoxNtp } from '@/features/config/types'

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
