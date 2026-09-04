import { NetnsType } from '@profile/constant/kernel'
import type {
  ExperimentalSection,
  HttpClientItem,
  NtpSection,
  Profile,
} from '@profile/types/profiles'
import type { NetnsItem } from '@profile/types/profiles/netns'
import type { TagItem } from '@profile/types/profiles/shared'
import type {
  Dns,
  Experimental,
  HttpClient,
  Inbound,
  NetworkNamespace,
  Ntp,
  Outbound,
  Route,
  SingBoxConfig,
} from '@profile/types/sing-box/config'
import { cleanObject } from '@profile/utils/helper'
import { parse } from 'yaml'

import { WriteFile } from '@/bridge/io'

import { CoreConfigFilePath } from '@/constant/kernel'
import { Branch } from '@/enums/app'
import { APP_TITLE } from '@/utils/env'
import { normalizeErrorMessage } from '@/utils/normalize'
import { deepClone, deepAssign } from '@/utils/others'

import type { Recordable } from '@/types/typescript'

import { _adaptToStableBranch } from './adapter'
import { generateCertProviders } from './cert-provider'
import { getGenerateContext } from './context'
import { generateDns } from './dns'
import { generateEndpoints } from './endpoint'
import { generateInbounds } from './inbound'
import { generateOutbounds } from './outbound'
import { generateRoute } from './route'
import {
  generateQuicOptions,
  generateHttp2Options,
  generateDialer,
  generateOutboundTls,
} from './shared'
import type { GenerateOptions, TagMaps } from './types'

const buildIdTagMapping = (items: TagItem[]): Map<string, string> =>
  new Map(items.map((v) => [v.id, v.tag]))

const generateNtp = (ntp: NtpSection, maps: TagMaps): Ntp => {
  if (!ntp.enabled) {
    return {} as Ntp
  }
  const { dialer, ...rest } = ntp
  return {
    ...(rest as Ntp),
    ...generateDialer(dialer, maps),
  }
}

const generateHttpClients = (httpClients: HttpClientItem[], maps: TagMaps): HttpClient[] =>
  httpClients
    .filter((hc) => hc.enable)
    .map((hc): HttpClient => {
      const { tag, config } = hc
      const { http2, quic, tls, dialer, version, ...rest } = config

      const http2OrQuicProps =
        version === 3 ? generateQuicOptions(quic) : version === 2 ? generateHttp2Options(http2) : {}

      return {
        ...rest,
        ...http2OrQuicProps,
        ...generateDialer(dialer, maps),
        tag,
        version,
        tls: generateOutboundTls(tls),
      }
    })

const generateNetns = (netns: NetnsItem[]) =>
  netns
    .filter((ns) => ns.enable)
    .map((ns): NetworkNamespace => {
      const { type, tag, config } = ns
      switch (type) {
        case NetnsType.Default:
        case NetnsType.Unshare: {
          return { type, tag, ...config } as NetworkNamespace
        }
        default: {
          throw new Error(`Unexpected netns type: ${type as string}`)
        }
      }
    })

const generateExperimental = (experimental: ExperimentalSection, maps: TagMaps): Experimental => {
  const { clash_api, cache_file } = experimental
  return {
    clash_api: {
      ...clash_api,
      external_ui_download_detour: maps.outbounds.get(clash_api.external_ui_download_detour),
    },
    cache_file: cache_file.enabled ? { ...cache_file } : undefined,
  } as Experimental
}

export const generateConfig = async (originalProfile: Profile, options: GenerateOptions = {}) => {
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
    certProviders: buildIdTagMapping(profile.certProviders),
    httpClients: buildIdTagMapping(profile.httpClients),
    netns: buildIdTagMapping(profile.netns),
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
      certificate: { ...profile.cert },
      certificate_providers: generateCertProviders(profile.certProviders, tagMaps),
      http_clients: generateHttpClients(profile.httpClients, tagMaps),
      network_namespaces: generateNetns(profile.netns),
      endpoints: generateEndpoints(profile.endpoints, tagMaps),
      inbounds: generateInbounds(profile.inbounds) as Inbound[],
      outbounds: (await generateOutbounds(profile.outbounds, ctx)) as Outbound[],
      route: generateRoute(
        profile.route,
        profile.inbounds,
        profile.outbounds,
        profile.dns,
        ctx,
      ) as Route,
      dns: generateDns(
        profile.dns,
        profile.route.rule_set,
        profile.inbounds,
        profile.outbounds,
      ) as Dns,
    } satisfies SingBoxConfig,
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

export const generateConfigFile = async (
  profile: Profile,
  beforeWrite: (config: Recordable) => Promise<Recordable>,
) => {
  const header = `DO NOT EDIT - Auto Generated by ${APP_TITLE}`

  const config = await generateConfig(profile)
  const finalConfig = await beforeWrite(config)

  await WriteFile(CoreConfigFilePath, JSON.stringify({ $schema: header, ...finalConfig }, null, 2))
}
