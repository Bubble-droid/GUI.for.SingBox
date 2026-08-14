import { parse, stringify } from 'yaml'

import * as bridgeApp from '@/bridge/app'
import * as bridgeExec from '@/bridge/exec'
import * as bridgeIo from '@/bridge/io'
import * as bridgeMmdb from '@/bridge/mmdb'
import * as bridgeNet from '@/bridge/net'
import * as bridgeServer from '@/bridge/server'
import * as bridgeRuntime from '@wails/runtime/runtime'

import * as utilsGenerator from '@/features/transformers/generator'
import * as restorer from '@/features/transformers/restorer'
import * as storesApp from '@/stores/app'
import * as storesAppSettings from '@/stores/appSettings'
import * as storesEnv from '@/stores/env'
import * as storesKernelApi from '@/stores/kernelApi'
import * as storesLogs from '@/stores/logs'
import * as storesPlugins from '@/stores/plugins'
import * as storesProfiles from '@/stores/profiles'
import * as storesRulesets from '@/stores/rulesets'
import * as storesScheduledtasks from '@/stores/scheduledtasks'
import * as storesSubscribes from '@/stores/subscribes'
import * as utilsEnv from '@/utils/env'
import * as utilsEventBus from '@/utils/eventBus'
import * as utilsFormat from '@/utils/format'
import * as utilsHelper from '@/utils/helper'
import * as utilsInteraction from '@/utils/interaction'
import * as utilsIs from '@/utils/is'
import * as utilsNormalize from '@/utils/normalize'
import * as utilsOthers from '@/utils/others'

const Bridge = {
  ...bridgeRuntime,
  ...bridgeIo,
  ...bridgeNet,
  ...bridgeExec,
  ...bridgeApp,
  ...bridgeServer,
  ...bridgeMmdb,
}

const Utils = {
  ...utilsEnv,
  ...utilsFormat,
  ...utilsGenerator,
  ...restorer,
  ...utilsIs,
  ...utilsOthers,
  ...utilsHelper,
  ...utilsInteraction,
  ...utilsEventBus,
  ...utilsNormalize,
}

const Stores = {
  ...storesAppSettings,
  ...storesProfiles,
  ...storesSubscribes,
  ...storesRulesets,
  ...storesPlugins,
  ...storesScheduledtasks,
  ...storesLogs,
  ...storesKernelApi,
  ...storesApp,
  ...storesEnv,
}

export const Plugins = Object.freeze({
  ...Bridge,
  ...Utils,
  ...Stores,
  YAML: Object.freeze({ parse, stringify }),
})

export type PluginsApi = typeof Plugins
