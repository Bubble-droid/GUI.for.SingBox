import { DefaultExperimental } from '@/constant'
import { deepAssign } from '@/utils'

import type { ExperimentalConfig } from '@/features/config/types'

export const restoreExperimental = (
  raw: Recordable,
  OutboundsIds: Recordable,
): ExperimentalConfig => {
  const template = DefaultExperimental()
  const experimental = deepAssign(template, raw)
  experimental.clash_api.external_ui_download_detour =
    OutboundsIds[raw.clash_api?.external_ui_download_detour] || ''
  return experimental
}
