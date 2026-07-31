export interface ExperimentalConfig {
  clash_api: ClashApiConfig
  cache_file: CacheFileConfig
}

export interface ClashApiConfig {
  external_controller: string
  external_ui: string
  external_ui_download_url: string
  external_ui_download_detour: string
  secret: string
  default_mode: string
  access_control_allow_origin: string[]
  access_control_allow_private_network: boolean
}

export interface CacheFileConfig {
  enabled: boolean
  path: string
  cache_id: string
  store_fakeip: boolean
  store_rdrc: boolean
  rdrc_timeout: string
}
