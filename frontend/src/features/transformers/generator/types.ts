export interface GenerateConfigOptions {
  enableStableConfigCompat?: boolean
  enablePluginProcessing?: boolean
  enableMixinProcessing?: boolean
  enableScriptProcessing?: boolean
}

export interface TagMaps {
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}
