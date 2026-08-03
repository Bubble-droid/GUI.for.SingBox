export interface MixinConfig {
  priority: 'mixin' | 'gui'
  format: 'json' | 'yaml'
  config: string
}

export interface ScriptConfig {
  code: string
}
