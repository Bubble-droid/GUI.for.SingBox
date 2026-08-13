import * as Vue from 'vue'
import { stringify, parse } from 'yaml'

import * as bridge_app from '@/bridge/app'
import * as bridge_exec from '@/bridge/exec'
import * as bridge_io from '@/bridge/io'
import * as bridge_mmdb from '@/bridge/mmdb'
import * as bridge_net from '@/bridge/net'
import * as bridge_server from '@/bridge/server'
import * as bridge_runtime from '@wails/runtime/runtime'

import * as utils_restorer from '@/features/transformers/restorer'
import * as stores_app from '@/stores/app'
import * as stores_appSettings from '@/stores/appSettings'
import * as stores_env from '@/stores/env'
import * as stores_kernelApi from '@/stores/kernelApi'
import * as stores_logs from '@/stores/logs'
import * as stores_plugins from '@/stores/plugins'
import * as stores_profiles from '@/stores/profiles'
import * as stores_rulesets from '@/stores/rulesets'
import * as stores_scheduledtasks from '@/stores/scheduledtasks'
import * as stores_subscribes from '@/stores/subscribes'
import * as utils_appContext from '@/utils/appContext'
import * as utils_completion from '@/utils/completion'
import * as utils_env from '@/utils/env'
import * as utils_eventBus from '@/utils/eventBus'
import * as utils_format from '@/utils/format'
import * as utils_generator from '@/utils/generator'
import * as utils_helper from '@/utils/helper'
import * as utils_interaction from '@/utils/interaction'
import * as utils_is from '@/utils/is'
import * as utils_migration from '@/utils/migration'
import * as utils_normalize from '@/utils/normalize'
import * as utils_others from '@/utils/others'
import * as utils_tray from '@/utils/tray'

const Bridge = {
  ...bridge_runtime,
  ...bridge_io,
  ...bridge_net,
  ...bridge_exec,
  ...bridge_app,
  ...bridge_server,
  ...bridge_mmdb,
}

const Utils = {
  ...utils_appContext,
  ...utils_env,
  ...utils_format,
  ...utils_generator,
  ...utils_restorer,
  ...utils_is,
  ...utils_others,
  ...utils_helper,
  ...utils_tray,
  ...utils_completion,
  ...utils_interaction,
  ...utils_eventBus,
  ...utils_migration,
  ...utils_normalize,
}

const Stores = {
  ...stores_appSettings,
  ...stores_profiles,
  ...stores_subscribes,
  ...stores_rulesets,
  ...stores_plugins,
  ...stores_scheduledtasks,
  ...stores_logs,
  ...stores_kernelApi,
  ...stores_app,
  ...stores_env,
}

/**
 * Expose methods to be used by the plugin system
 */
window.Plugins = {
  ...Bridge,
  ...Utils,
  ...Stores,
  YAML: {
    parse,
    stringify,
  },
}

window.Vue = Vue

window.AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
