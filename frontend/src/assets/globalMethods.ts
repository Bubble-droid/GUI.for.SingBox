import * as Vue from 'vue'
import { stringify, parse } from 'yaml'

import * as Bridge from '@/bridge'
import * as Stores from '@/stores'
import * as Utils from '@/utils'

const PluginApis = {
  ...Bridge,
  ...Utils,
  ...Stores,
  YAML: {
    parse,
    stringify,
  },
} as const

/**
 * Expose methods to be used by the plugin system
 */
window.Plugins = PluginApis

window.Vue = Vue

window.AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

export type PluginApis = typeof PluginApis
