import { Outbound } from '@features/constant/kernel'

export const CoreWorkingDirectory = 'data/sing-box'
export const CorePidFilePath = `${CoreWorkingDirectory}/pid.txt`
export const CoreLogFilePath = `${CoreWorkingDirectory}/sing-box.log`
export const CoreConfigFilePath = `${CoreWorkingDirectory}/config.json`
export const CoreCacheFilePath = `${CoreWorkingDirectory}/cache.db`

export const EmptyRuleSet = {
  version: 1,
  rules: [],
}

export const DefaultExcludeProtocols = 'direct|reject|selector|urltest|block|dns|shadowsocksr'

export const BuiltInOutbound = [Outbound.Direct, Outbound.Block]

export const DefaultConnections = () => ({
  visibility: {
    'metadata.type': true,
    'metadata.processPath': false,
    'metadata.host': true,
    'metadata.sourceIP': false,
    'metadata.destinationIP': false,
    rule: true,
    chains: true,
    up: true,
    down: true,
    upload: true,
    download: true,
    start: true,
  },
  order: [
    'metadata.type',
    'metadata.processPath',
    'metadata.host',
    'metadata.sourceIP',
    'metadata.destinationIP',
    'rule',
    'chains',
    'up',
    'down',
    'upload',
    'download',
    'start',
  ],
})

export const DefaultCoreConfig = () => ({
  env: {},
  args: ['run', '--disable-color', '-c', '$CORE_BASE_PATH/config.json', '-D', '$CORE_BASE_PATH'],
})
