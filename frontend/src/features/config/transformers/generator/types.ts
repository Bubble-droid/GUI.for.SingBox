export interface GenerateConfigOptions {
  enableStableConfigCompat?: boolean
  enablePluginProcessing?: boolean
  enableMixinProcessing?: boolean
  enableScriptProcessing?: boolean
}

export interface TagMaps {
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}
