import * as Vue from 'vue'

import { Plugins } from '@/assets/pluginApis'

/**
 * Expose methods to be used by the plugin system
 */
window.Plugins = Plugins

window.Vue = Vue

window.AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
