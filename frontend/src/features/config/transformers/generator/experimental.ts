import { filterInvalidProps } from '@/features/utils'

import type { ExperimentalConfig, SingBoxExperimental } from '@/features/config/types'

import type { TagMaps } from './types'

export const generateExperimental = (
  experimental: ExperimentalConfig,
  maps: TagMaps,
): SingBoxExperimental => {
  const { clash_api, cache_file } = experimental
  return filterInvalidProps({
    clash_api: filterInvalidProps({
      ...clash_api,
      external_ui_download_detour: maps.outbounds.get(clash_api.external_ui_download_detour),
    }),
    cache_file: cache_file.enabled
      ? { ...filterInvalidProps(cache_file), enabled: true }
      : undefined,
  })
}
