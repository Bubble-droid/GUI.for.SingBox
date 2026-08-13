import { filterInvalidProps } from '@features/utils/helper'
import type { Profile } from '@profiles'
import type { TagItem } from '@profiles/shared'
import { parse } from 'yaml'

import { Branch } from '@/enums/app'
import { deepClone, deepAssign } from '@/utils/others'

import { _adaptToStableBranch } from './adapter'
import { generateCertificate } from './certificate'
import { generateCertificateProviders } from './certificate_provider'
import { generateDns } from './dns'
import { generateEndpoints } from './endpoints'
import { generateExperimental } from './experimental'
import { generateHttpClients } from './http_client'
import { generateInbounds } from './inbounds'
import { generateNetns } from './netns'
import { generateNtp } from './ntp'
import { generateOutbounds } from './outbounds'
import { generateRoute } from './route'
import type { GenerateConfigOptions, GenerateContext, TagMaps } from './types'

const buildIdTagMapping = (items: TagItem[]): Map<string, string> => {
  return new Map(items.map((v) => [v.id, v.tag]))
}

export const generateConfig = async (
  originalProfile: Profile,
  ctx: GenerateContext,
  options: GenerateConfigOptions = {},
) => {
  if (typeof options === 'boolean') {
    options = { enableStableConfigCompat: options }
  }
  const isMainBranch = ctx.branch === Branch.Main

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
    endpoints: buildIdTagMapping(profile.endpoints),
    inbounds: buildIdTagMapping([...profile.endpoints, ...profile.inbounds]),
    outbounds: buildIdTagMapping([...profile.endpoints, ...profile.outbounds]),
    dnsServers: buildIdTagMapping(profile.dns.servers),
  }

  // step 1
  let config: Recordable = filterInvalidProps({
    log: filterInvalidProps(profile.log),
    ntp: generateNtp(profile.ntp, tagMaps),
    experimental: generateExperimental(profile.experimental, tagMaps),
    certificate: generateCertificate(profile.certificate),
    certificate_providers: generateCertificateProviders(profile.certificate_providers, tagMaps),
    http_clients: generateHttpClients(profile.http_clients, tagMaps),
    network_namespaces: generateNetns(profile.network_namespaces),
    endpoints: generateEndpoints(profile.endpoints, tagMaps),
    inbounds: generateInbounds(profile.inbounds),
    outbounds: await generateOutbounds(profile.outbounds, ctx),
    route: generateRoute(profile.route, profile.inbounds, profile.outbounds, profile.dns, ctx),
    dns: generateDns(profile.dns, profile.route.rule_set, profile.inbounds, profile.outbounds),
  })

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
