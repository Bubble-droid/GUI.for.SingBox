import { createExperimental } from '@defaults/experimental'
import type { SingBoxExperimental } from '@features/types/sing-box'
import { ensureArray } from '@features/utils/helper'
import type { ExperimentalConfig } from '@profiles/experimental'

import type { IdMaps } from './types'

export const restoreExperimental = (
  raw: SingBoxExperimental = {},
  maps: IdMaps,
): ExperimentalConfig => {
  const template = createExperimental()
  const { clash_api, cache_file } = raw

  return {
    clash_api: {
      ...template.clash_api,
      ...clash_api,
      access_control_allow_origin: ensureArray(clash_api?.access_control_allow_origin),
      external_ui_download_detour:
        maps.outbounds.get(clash_api?.external_ui_download_detour ?? '') ?? '',
    },
    cache_file: {
      ...template.cache_file,
      ...cache_file,
    },
  }
}
