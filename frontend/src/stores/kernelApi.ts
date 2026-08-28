import { createInboundMixed } from '@defaults/inbounds'
import { Inbound, TunStack, RuleSetType } from '@features/constant/kernel'
import type { SingBoxConfig } from '@features/types/sing-box'
import type { Profile } from '@profiles'
import { restoreProfile } from '@restorer'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { ProcessInfo, ExecBackground, KillProcess } from '@/bridge/exec'
import { ReadFile, RemoveFile } from '@/bridge/io'

import {
  getProxies,
  getConfigs,
  setConfigs,
  onLogs,
  onMemory,
  onConnections,
  onTraffic,
  initWebsocket,
  destroyWebsocket,
  probeApiAvailability,
} from '@/api/kernel'
import { Branch } from '@/constant/app'
import {
  CoreConfigFilePath,
  CoreLogFilePath,
  CorePidFilePath,
  CoreWorkingDirectory,
} from '@/constant/kernel'
import { eventBus } from '@/utils/eventBus'
import { generateConfigFile } from '@/utils/generator'
import { getKernelFileName, getKernelRuntimeArgs, getKernelRuntimeEnv } from '@/utils/helper'
import { message } from '@/utils/interaction'
import { normalizeProxyHost } from '@/utils/normalize'
import { deepClone, sleep } from '@/utils/others'
import { updateTrayAndMenus } from '@/utils/tray'

import type { CoreApiConfig, CoreApiConfigTun, CoreApiProxy } from '@/types/kernel'

import { StoreDep, useStoreDeps } from './deps'

type ProxyType = typeof Inbound.Mixed | typeof Inbound.Http | typeof Inbound.Socks
interface ProxyEndpoint {
  schema: 'http' | 'socks5'
  host: string
  port: number
  username: string
  password: string
  proxyType: ProxyType
}

type PortPatchMap = Record<ProxyType, number>
interface TunPatchOptions extends Partial<CoreApiConfigTun> {
  interface_name?: string
}

type TunType = typeof Inbound.Tun
type TunPatchField = TunType | `${TunType}-${'stack' | 'device'}` | 'interface-name'
type TunPatchMep = Record<TunPatchField, TunPatchOptions>

interface ConfigUpdateMap
  extends Pick<CoreApiConfig, 'mode' | 'allow-lan'>, PortPatchMap, TunPatchMep {
  inbound: null
}

type ConfigUpdateEntry = {
  [K in keyof ConfigUpdateMap]: [field: K, value: ConfigUpdateMap[K]]
}[keyof ConfigUpdateMap]

export const useKernelApiStore = defineStore('kernelApi', () => {
  const envStore = useStoreDeps(StoreDep.EnvStore)
  const logsStore = useStoreDeps(StoreDep.LogsStore)
  const pluginsStore = useStoreDeps(StoreDep.PluginsStore)
  const profilesStore = useStoreDeps(StoreDep.ProfilesStore)
  const subscribesStore = useStoreDeps(StoreDep.SubscribesStore)
  const rulesetsStore = useStoreDeps(StoreDep.RulesetsStore)
  const appSettingsStore = useStoreDeps(StoreDep.AppSettingsStore)

  /** RESTful API */
  const config = ref<CoreApiConfig>({
    port: 0,
    'mixed-port': 0,
    'socks-port': 0,
    'interface-name': '',
    'allow-lan': false,
    mode: '',
    tun: {
      enable: false,
      stack: '' as TunStack,
      device: '',
    },
  })

  let runtimeProfile: Profile | undefined

  const proxies = ref<Record<string, CoreApiProxy>>({})

  const refreshConfig = async () => {
    const _config = await getConfigs()

    config.value = {
      ..._config,
      tun: config.value.tun,
    }

    if (!runtimeProfile) {
      const txt = await ReadFile(CoreConfigFilePath)
      runtimeProfile = restoreProfile(JSON.parse(txt) as SingBoxConfig)
      const profile = profilesStore.currentProfile
      if (profile) {
        const _profile = deepClone(profile)
        _profile.inbounds.forEach((inbound) => {
          const runtimeInbound = runtimeProfile?.inbounds.find((v) => v.tag === inbound.tag)
          if (runtimeInbound) {
            runtimeInbound.id = inbound.id
          } else {
            inbound.enable = false
            runtimeProfile?.inbounds.push(inbound)
          }
        })
        runtimeProfile.id = _profile.id
        runtimeProfile.outbounds = _profile.outbounds
        runtimeProfile.experimental = _profile.experimental
        runtimeProfile.dns = _profile.dns
        runtimeProfile.route = _profile.route
        runtimeProfile.mixin = _profile.mixin
        runtimeProfile.script = _profile.script
      }
    }

    const mixed = runtimeProfile.inbounds.find((v) => v.enable && v.mixed)
    const http = runtimeProfile.inbounds.find((v) => v.enable && v.http)
    const socks = runtimeProfile.inbounds.find((v) => v.enable && v.socks)
    const tun = runtimeProfile.inbounds.find((v) => v.tun)
    config.value['mixed-port'] = mixed?.mixed?.listen.listen_port ?? 0
    config.value.port = http?.http?.listen.listen_port ?? 0
    config.value['socks-port'] = socks?.socks?.listen.listen_port ?? 0
    config.value['allow-lan'] = [
      mixed?.mixed?.listen.listen,
      http?.http?.listen.listen,
      socks?.socks?.listen.listen,
    ].some((address) => address === '0.0.0.0' || address === '::')

    config.value.tun.enable = Boolean(tun?.enable)
    config.value.tun.device = tun?.tun?.interface_name ?? ''
    config.value.tun.stack = tun?.tun?.stack ?? ('' as TunStack)
    config.value['interface-name'] = runtimeProfile.route.default_interface
  }

  const resetConfig = () => {
    config.value.port = 0
    config.value['socks-port'] = 0
    config.value['mixed-port'] = 0
    config.value['interface-name'] = ''
    config.value['allow-lan'] = false
    config.value.mode = ''
    config.value.tun.enable = false
    config.value.tun.stack = '' as TunStack
    config.value.tun.device = ''
  }

  const updateConfig = async (...[field, value]: ConfigUpdateEntry) => {
    if (field === 'mode') {
      await setConfigs({ mode: value })
      await refreshConfig()
      return
    }

    const patchInbound = () => {
      if (!runtimeProfile) {
        return
      }
      const inbound = runtimeProfile.inbounds.find(
        (v) =>
          (v.type === Inbound.Mixed && v.mixed?.listen.listen_port) ??
          (v.type === Inbound.Http && v.http?.listen.listen_port) ??
          (v.type === Inbound.Socks && v.socks?.listen.listen_port),
      )
      if (!inbound) {
        throw new Error('home.overview.needPort')
      }
      inbound.enable = true
    }

    const patchInboundPort = (type: ProxyType, port: number) => {
      if (!runtimeProfile) {
        return
      }
      let inbound = runtimeProfile.inbounds.find((v) => v.type === type)
      if (inbound) {
        inbound[type]!.listen.listen_port = port
      } else {
        const _type = createInboundMixed()
        _type.listen.listen_port = port
        inbound = {
          id: `${type}-in`,
          tag: `${type}-in`,
          type,
          enable: true,
          [type]: _type,
        }
        runtimeProfile.inbounds.push(inbound)
      }
      inbound.enable = port !== 0
    }

    const patchInboundAddress = (allowLan: boolean) => {
      if (!runtimeProfile) {
        return
      }
      runtimeProfile.inbounds.forEach((inbound) => {
        if (inbound.type === Inbound.Tun) {
          return
        }
        inbound[inbound.type]!.listen.listen = allowLan ? '0.0.0.0' : '127.0.0.1'
      })
    }

    const patchInboundTun = (options: TunPatchOptions) => {
      if (!runtimeProfile) {
        return
      }
      const inbound = runtimeProfile.inbounds.find((v) => v.type === Inbound.Tun)
      if (!inbound) {
        throw new Error('home.overview.needTun')
      }
      const completeOpts = { ...config.value.tun, ...options }
      inbound.enable = completeOpts.enable
      inbound.tun!.stack = completeOpts.stack || TunStack.Mixed
      inbound.tun!.interface_name = completeOpts.device || ''
      if (completeOpts.interface_name) {
        runtimeProfile.route.default_interface = completeOpts.interface_name
      }
      runtimeProfile.route.auto_detect_interface = !completeOpts.interface_name
    }

    switch (field) {
      case 'inbound': {
        patchInbound()
        break
      }

      case 'http':
      case 'socks':
      case 'mixed': {
        patchInboundPort(field, value)
        break
      }

      case 'allow-lan': {
        patchInboundAddress(value)
        break
      }

      case 'tun':
      case 'tun-stack':
      case 'tun-device':
      case 'interface-name': {
        patchInboundTun(value)
        break
      }
    }

    await restartCore(undefined, true)
    await envStore.updateSystemProxyStatus()
  }

  const refreshProviderProxies = async () => {
    const { proxies: b } = await getProxies()
    proxies.value = b
  }

  /* Bridge API */
  const corePid = ref(-1)
  const running = ref(false)
  const starting = ref(false)
  const stopping = ref(false)
  const restarting = ref(false)
  const needRestart = ref(false)
  const coreStateLoading = ref(true)
  let isCoreStartedByThisInstance = false
  let { promise: coreStoppedPromise, resolve: coreStoppedResolver } = Promise.withResolvers()

  const initCoreState = async () => {
    corePid.value = Number(await ReadFile(CorePidFilePath).catch(() => -1))
    const processName = corePid.value === -1 ? '' : await ProcessInfo(corePid.value).catch(() => '')
    running.value = processName.startsWith('sing-box')

    coreStateLoading.value = false

    if (running.value) {
      initWebsocket()
      await Promise.all([refreshConfig(), refreshProviderProxies()])
      await envStore.updateSystemProxyStatus()
    } else if (appSettingsStore.app.autoStartKernel) {
      await startCore()
    }
  }

  const runCoreProcess = async (isAlpha: boolean) => {
    let stopped = false
    const pid = await ExecBackground(
      `${CoreWorkingDirectory}/${getKernelFileName(isAlpha)}`,
      getKernelRuntimeArgs(isAlpha),
      undefined,
      (end) => {
        void (async () => {
          stopped = true
          const logs = await ReadFile(CoreLogFilePath, { Range: '-4096' }).catch(String)
          logs.split('\n').forEach((line) => {
            if (line) {
              logsStore.recordKernelLog(line)
            }
          })
          if (end) {
            logsStore.recordKernelLog(end)
          }
          void onCoreStopped()
        })()
      },
      {
        PidFile: CorePidFilePath,
        LogFile: CoreLogFilePath,
        Env: getKernelRuntimeEnv(isAlpha),
      },
    )

    // oxlint-disable-next-line no-unmodified-loop-condition
    while (!stopped) {
      const ok = await probeApiAvailability().catch(() => false)
      if (ok) {
        break
      }
      await sleep(500)
    }

    if (stopped) {
      throw new Error('kernel.startupFailed')
    }

    return pid
  }

  const onCoreStarted = async (pid: number) => {
    corePid.value = pid
    running.value = true
    needRestart.value = false
    isCoreStartedByThisInstance = true
    coreStoppedPromise = new Promise((resolve) => {
      coreStoppedResolver = resolve
    })

    initWebsocket()
    await Promise.all([refreshConfig(), refreshProviderProxies()])

    if (appSettingsStore.app.autoSetSystemProxy) {
      await envStore.setSystemProxy().catch((error) => message.error(error))
    }
    if (appSettingsStore.app.autoSetSystemDNS) {
      await envStore.setSystemDNS(true).catch((error) => message.error(error))
    }
    await envStore.updateSystemProxyStatus()

    await pluginsStore.onCoreStartedTrigger()
  }

  const onCoreStopped = async () => {
    if (!isCoreStartedByThisInstance) {
      await RemoveFile(CorePidFilePath)
    }

    corePid.value = -1
    running.value = false
    needRestart.value = false

    destroyWebsocket()

    await envStore.updateSystemProxyStatus()
    if (envStore.systemProxy) {
      await envStore.clearSystemProxy()
    }
    if (appSettingsStore.app.autoSetSystemDNS || envStore.systemDNSSet) {
      await envStore.setSystemDNS(false).catch((error) => message.error(error))
    }

    resetConfig()

    await pluginsStore.onCoreStoppedTrigger()

    coreStoppedResolver(null)
  }

  const startCore = async (_profile?: Profile) => {
    if (running.value) {
      throw new Error('The core is already running')
    }

    logsStore.clearKernelLog()

    const { profile: profileID, branch } = appSettingsStore.app.kernel
    const profile = _profile ?? profilesStore.getProfileById(profileID)
    if (!profile) {
      throw new Error('Choose a profile first')
    }

    if (!_profile) {
      runtimeProfile = undefined
    }

    starting.value = true
    try {
      await generateConfigFile(profile, (generateConfig) =>
        pluginsStore.onBeforeCoreStartTrigger(generateConfig, profile),
      )
      const isAlpha = branch === Branch.Alpha
      const pid = await runCoreProcess(isAlpha)
      pid && (await onCoreStarted(pid))
    } finally {
      starting.value = false
    }
  }

  const stopCore = async () => {
    if (!running.value) {
      throw new Error('The core is not running')
    }

    stopping.value = true
    try {
      await pluginsStore.onBeforeCoreStopTrigger()
      await KillProcess(corePid.value)
      await (isCoreStartedByThisInstance ? coreStoppedPromise : onCoreStopped())
    } finally {
      stopping.value = false
    }
  }

  const restartCore = async (cleanupTask?: () => Promise<any>, keepRuntimeProfile = false) => {
    restarting.value = true
    try {
      await stopCore()
      await cleanupTask?.()
      await startCore(keepRuntimeProfile ? runtimeProfile : undefined)
    } finally {
      needRestart.value = false
      restarting.value = false
    }
  }

  const getProxyProfileOptions = (proxyType: ProxyType) => {
    const inboundTypeMap = {
      mixed: Inbound.Mixed,
      http: Inbound.Http,
      socks: Inbound.Socks,
    } satisfies Record<ProxyType, Inbound>

    const inbound = runtimeProfile?.inbounds.find(
      (item) => item.enable && item.type === inboundTypeMap[proxyType],
    )

    const inboundOptions =
      proxyType === Inbound.Mixed
        ? inbound?.mixed
        : proxyType === Inbound.Http
          ? inbound?.http
          : inbound?.socks

    const listen = inboundOptions?.listen.listen ?? ''
    const auth = inboundOptions?.users[0]?.trim()
    const host = normalizeProxyHost((listen || '').trim())

    if (!auth) {
      return { host, username: '', password: '' }
    }

    const [username, ...passwordParts] = auth.split(':')

    return {
      host,
      username: username ?? '',
      password: passwordParts.join(':'),
    }
  }

  const getProxyEndpoint = (): ProxyEndpoint | undefined => {
    const { port, 'socks-port': socksPort, 'mixed-port': mixedPort } = config.value
    let targetPort = 0
    let proxyType: ProxyType | undefined

    if (mixedPort) {
      targetPort = mixedPort
      proxyType = 'mixed'
    } else if (port) {
      targetPort = port
      proxyType = 'http'
    } else if (socksPort) {
      targetPort = socksPort
      proxyType = 'socks'
    } else {
      return undefined
    }

    const { host, username, password } = getProxyProfileOptions(proxyType)
    const schema = proxyType === 'socks' ? 'socks5' : 'http'

    return {
      schema,
      host,
      port: targetPort,
      username,
      password,
      proxyType,
    }
  }

  eventBus.on('profileChange', ({ id }) => {
    if (running.value && id === appSettingsStore.app.kernel.profile) {
      needRestart.value = true
    }
  })

  eventBus.on('subscriptionChange', ({ id }) => {
    if (running.value && profilesStore.currentProfile) {
      const inUse = profilesStore.currentProfile.outbounds.some(({ outbounds }) =>
        outbounds.some((outbound) => outbound.type === 'Subscription' && outbound.id === id),
      )
      if (inUse) {
        needRestart.value = true
      }
    }
  })

  eventBus.on('subscriptionsChange', () => {
    if (running.value && profilesStore.currentProfile) {
      const enabledSubs = new Set(
        subscribesStore.subscribes.flatMap((v) => (v.disabled ? [] : v.id)),
      )
      const inUse = profilesStore.currentProfile.outbounds.some(({ outbounds }) =>
        outbounds.some(
          (outbound) => outbound.type === 'Subscription' && enabledSubs.has(outbound.id),
        ),
      )
      if (inUse) {
        needRestart.value = true
      }
    }
  })

  const collectRulesetIDs = () => {
    if (!profilesStore.currentProfile) {
      return []
    }
    const l1 = profilesStore.currentProfile.route.rule_set.flatMap((ruleset) =>
      ruleset.type === RuleSetType.Local ? ruleset.path : [],
    )
    return l1
  }

  eventBus.on('rulesetChange', ({ id }) => {
    if (running.value && profilesStore.currentProfile) {
      const inUse = profilesStore.currentProfile.route.rule_set.some(
        (ruleset) => ruleset.type === RuleSetType.Local && ruleset.path === id,
      )
      if (inUse) {
        needRestart.value = true
      }
    }
  })

  eventBus.on('rulesetsChange', () => {
    if (running.value && profilesStore.currentProfile) {
      const enabledRulesets = new Set(
        rulesetsStore.rulesets.flatMap((v) => (v.disabled ? [] : v.id)),
      )
      const inUse = collectRulesetIDs().some((v) => enabledRulesets.has(v))
      if (inUse) {
        needRestart.value = true
      }
    }
  })

  watch(needRestart, (v) => {
    if (v && appSettingsStore.app.autoRestartKernel) {
      void restartCore()
    }
  })

  const watchSources = computed(() => {
    const source = [config.value.mode, config.value.tun.enable]
    if (!appSettingsStore.app.addGroupToMenu) {
      return source.join('')
    }

    const { unAvailable, sortByDelay } = appSettingsStore.app.kernel

    const proxySignature = Object.values(proxies.value)
      .map((group) => group.name + group.now)
      .toSorted()
      .join(',')

    return [...source, proxySignature, unAvailable, sortByDelay].join('')
  })

  watch([watchSources, running], updateTrayAndMenus)

  return {
    startCore,
    stopCore,
    restartCore,
    initCoreState,
    pid: corePid,
    running,
    starting,
    stopping,
    restarting,
    needRestart,
    coreStateLoading,
    config,
    proxies,
    refreshConfig,
    updateConfig,
    refreshProviderProxies,
    getProxyEndpoint,

    onLogs,
    onMemory,
    onTraffic,
    onConnections,
  }
})
