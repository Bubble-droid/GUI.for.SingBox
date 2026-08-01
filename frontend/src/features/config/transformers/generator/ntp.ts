import { filterInvalidProps } from '@/features/utils'

import type { NtpConfig, SingBoxNtp } from '@/features/config/types'

import { generateDialer } from './shared'
import type { TagMaps } from './types'

export const generateNtp = (ntp: NtpConfig, maps: TagMaps): SingBoxNtp => {
  if (!ntp.enabled) return {} as SingBoxNtp
  const { dialer, ...rest } = ntp
  return filterInvalidProps({
    ...(rest as SingBoxNtp),
    ...generateDialer(dialer, maps),
  })
}
