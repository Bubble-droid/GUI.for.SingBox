import type { SingBoxExperimental } from '@features/types/sing-box'
import type { ExperimentalConfig } from '@profiles/experimental'

import type { TagMaps } from './types'

export const generateExperimental = (
  experimental: ExperimentalConfig,
  maps: TagMaps,
): SingBoxExperimental => {
  const { clash_api, cache_file } = experimental
  return {
    clash_api: {
      ...clash_api,
      external_ui_download_detour: maps.outbounds.get(clash_api.external_ui_download_detour),
    },
    cache_file: cache_file.enabled ? { ...cache_file } : undefined,
  } as SingBoxExperimental
}
