import type { ExperimentalConfig, OutboundConfig } from '@/features/config/types'

export const generateExperimental = (
  experimental: ExperimentalConfig,
  outbounds: OutboundConfig[],
) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)?.tag
  return {
    clash_api: {
      ...experimental.clash_api,
      external_ui_download_detour: getOutbound(experimental.clash_api.external_ui_download_detour),
    },
    cache_file: {
      ...experimental.cache_file,
      store_rdrc: undefined,
    },
  }
}
