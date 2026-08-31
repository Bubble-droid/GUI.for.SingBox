import * as Vue from 'vue'

import { Plugins } from '@/assets/pluginApis'

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
// oxlint-disable typescript/no-unnecessary-type-parameters
interface AsyncFunctionConstructor {
  new <TArgs extends any[] = any[], TReturn = any>(
    ...args: string[]
  ): (...args: TArgs) => Promise<Awaited<TReturn>>

  <TArgs extends any[] = any[], TReturn = any>(
    ...args: string[]
  ): (...args: TArgs) => Promise<Awaited<TReturn>>

  readonly prototype: Function
}

declare global {
  /**
   * The variable is initialized in `globalMethods.ts:11`
   */
  var Plugins: any

  /**
   * The variable is initialized in `globalMethods.ts:23`
   */
  var AsyncFunction: AsyncFunctionConstructor
  /**
   * The variable is initialized in `globalMethods.ts:21`
   */
  var Vue: any
}

/**
 * Expose methods to be used by the plugin system
 */
globalThis.Plugins = Plugins

globalThis.Vue = Vue

globalThis.AsyncFunction = Object.getPrototypeOf(async () => {
  /* Empty */
}).constructor
