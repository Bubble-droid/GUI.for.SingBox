import * as Vue from 'vue'

import { Plugins } from '@/assets/pluginApis'

/**
 * Expose methods to be used by the plugin system
 */
globalThis.Plugins = Plugins

globalThis.Vue = Vue

globalThis.AsyncFunction = Object.getPrototypeOf(async () => {
  /* Empty */
}).constructor
