import type { SingBoxConfig } from '@features/types/sing-box'
import { cleanObject } from '@features/utils/helper'
import type { Profile } from '@profiles'
import type { TagItem } from '@profiles/shared'
import { parse } from 'yaml'

import { Branch } from '@/constant/app'
import { normalizeErrorMessage } from '@/utils/normalize'
import { deepClone, deepAssign } from '@/utils/others'

import { _adaptToStableBranch } from './adapter'
import { generateCertificateProviders } from './certificate_provider'
import { getGenerateContext } from './context'
import { generateDns } from './dns'
import { generateEndpoints } from './endpoints'
import { generateExperimental } from './experimental'
import { generateHttpClients } from './http_client'
import { generateInbounds } from './inbounds'
import { generateNetns } from './netns'
import { generateNtp } from './ntp'
import { generateOutbounds } from './outbounds'
import { generateRoute } from './route'
import type { GenerateConfigOptions, TagMaps } from './types'

const buildIdTagMapping = (items: TagItem[]): Map<string, string> =>
  new Map(items.map((v) => [v.id, v.tag]))

export const generateConfig = async (
  originalProfile: Profile,
  options: GenerateConfigOptions = {},
) => {
  if (typeof options === 'boolean') {
    options = { enableStableConfigCompat: options }
  }

  const ctx = getGenerateContext()
  const isMainBranch = ctx.appSettings.kernel.branch === Branch.Main

  const {
    enableStableConfigCompat = isMainBranch,
    enablePluginProcessing = true,
    enableMixinProcessing = true,
    enableScriptProcessing = true,
  } = options

  const profile = deepClone(originalProfile)

  const tagMaps: TagMaps = {
    certProviders: buildIdTagMapping(profile.certificate_providers),
    httpClients: buildIdTagMapping(profile.http_clients),
    netns: buildIdTagMapping(profile.network_namespaces),
    endpoints: buildIdTagMapping(profile.endpoints),
    inbounds: buildIdTagMapping([...profile.endpoints, ...profile.inbounds]),
    outbounds: buildIdTagMapping([...profile.endpoints, ...profile.outbounds]),
    dnsServers: buildIdTagMapping(profile.dns.servers),
  }

  // step 1
  let config = cleanObject(
    {
      log: { ...profile.log },
      ntp: generateNtp(profile.ntp, tagMaps),
      experimental: generateExperimental(profile.experimental, tagMaps),
      certificate: { ...profile.certificate },
      certificate_providers: generateCertificateProviders(profile.certificate_providers, tagMaps),
      http_clients: generateHttpClients(profile.http_clients, tagMaps),
      network_namespaces: generateNetns(profile.network_namespaces),
      endpoints: generateEndpoints(profile.endpoints, tagMaps),
      inbounds: generateInbounds(profile.inbounds),
      outbounds: await generateOutbounds(profile.outbounds, ctx),
      route: generateRoute(profile.route, profile.inbounds, profile.outbounds, profile.dns, ctx),
      dns: generateDns(profile.dns, profile.route.rule_set, profile.inbounds, profile.outbounds),
    } as SingBoxConfig,
    true,
  )

  // adapt to stable branch
  if (enableStableConfigCompat) {
    _adaptToStableBranch(config)
  }

  // step 2
  if (enablePluginProcessing) {
    config = await ctx.onGenerate(config, originalProfile)
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
    const fn = new globalThis.AsyncFunction(
      'config',
      `${originalProfile.script.code}; return await onGenerate(config)`,
    )
    try {
      config = await fn(config)
    } catch (error) {
      throw new Error(normalizeErrorMessage(error), { cause: error })
    }

    if (typeof config !== 'object') {
      throw new TypeError('Wrong result')
    }
  }

  return config
}
