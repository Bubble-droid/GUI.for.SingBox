import { parse } from 'yaml'

import { Branch } from '@/enums/app'
import { filterInvalidProps } from '@/features/utils'
import { useAppSettingsStore, usePluginsStore } from '@/stores'
import { deepAssign, deepClone } from '@/utils'

import type { Profile, TagItem } from '@/features/config/types'

import { _adaptToStableBranch } from './adapter'
import { generateDns } from './dns'
import { generateExperimental } from './experimental'
import { generateInbounds } from './inbounds'
import { generateNtp } from './ntp'
import { generateOutbounds } from './outbounds'
import { generateRoute } from './route'
import type { GenerateConfigOptions, TagMaps } from './types'

export * from './shared'
export * from './ntp'
export * from './inbounds'
export * from './outbounds'
export * from './route'
export * from './dns'

const buildIdTagMapping = (items: TagItem[]): Map<string, string> => {
  return new Map(items.map((v) => [v.id, v.tag]))
}

export const generateConfig = async (
  originalProfile: Profile,
  options: GenerateConfigOptions = {},
) => {
  if (typeof options === 'boolean') {
    options = { enableStableConfigCompat: options }
  }
  const appSettings = useAppSettingsStore()
  const isMainBranch = appSettings.app.kernel.branch === Branch.Main

  const {
    enableStableConfigCompat = isMainBranch,
    enablePluginProcessing = true,
    enableMixinProcessing = true,
    enableScriptProcessing = true,
  } = options

  const profile = deepClone(originalProfile)

  const tagMaps: TagMaps = {
    outbounds: buildIdTagMapping(profile.outbounds),
    dnsServers: buildIdTagMapping(profile.dns.servers),
  }

  // step 1
  let config: Recordable = {
    log: filterInvalidProps(profile.log),
    ntp: generateNtp(profile.ntp, tagMaps),
    experimental: generateExperimental(profile.experimental, tagMaps),
    inbounds: generateInbounds(profile.inbounds),
    outbounds: await generateOutbounds(profile.outbounds),
    route: generateRoute(profile.route, profile.inbounds, profile.outbounds, profile.dns),
    dns: generateDns(profile.dns, profile.route.rule_set, profile.inbounds, profile.outbounds),
  }

  // adapt to stable branch
  if (enableStableConfigCompat) {
    _adaptToStableBranch(config)
  }

  // step 2
  if (enablePluginProcessing) {
    const pluginsStore = usePluginsStore()
    config = await pluginsStore.onGenerateTrigger(config, originalProfile)
  }

  // step 3
  if (enableMixinProcessing) {
    const { priority, config: mixin } = originalProfile.mixin
    if (priority === 'mixin') {
      deepAssign(config, parse(mixin))
    } else if (priority === 'gui') {
      deepAssign(config, deepAssign(parse(mixin), config))
    }
  }

  // step 4
  if (enableScriptProcessing) {
    const fn = new window.AsyncFunction(
      'config',
      `${originalProfile.script.code}; return await onGenerate(config)`,
    )
    try {
      config = await fn(config)
    } catch (error: any) {
      throw error.message || error
    }

    if (typeof config !== 'object') {
      throw 'Wrong result'
    }
  }

  return config
}
