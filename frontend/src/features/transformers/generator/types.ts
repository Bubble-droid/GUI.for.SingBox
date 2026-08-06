export interface GenerateConfigOptions {
  enableStableConfigCompat?: boolean
  enablePluginProcessing?: boolean
  enableMixinProcessing?: boolean
  enableScriptProcessing?: boolean
}

export interface TagMaps {
  certProviders: Map<string, string>
  httpClients: Map<string, string>
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}
