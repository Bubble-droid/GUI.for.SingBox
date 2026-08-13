import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { GetEnv, GetSystemProxy, SetSystemProxy, SetSystemDNS } from '@/bridge/app'

import { OS } from '@/enums/app'
import { formatProxyHost } from '@/utils/format'
import { ignoredError } from '@/utils/others'
import { updateTrayAndMenus } from '@/utils/tray'

import { useStoreDeps } from './deps'

export const useEnvStore = defineStore('env', () => {
  const appSettings = useStoreDeps('appSettingsStore')
  const kernelApiStore = useStoreDeps('kernelApiStore')

  const env = ref<App.AppEnv>({
    appName: '',
    appVersion: '',
    basePath: '',
    appPath: '',
    os: '' as App.OS,
    arch: '',
    isPrivileged: false,
    isSystemPackage: false,
    isBundled: false,
    appDataPath: '',
    appConfigPath: '',
    appCachePath: '',
  })

  const systemProxy = ref(false)
  const systemDNSSet = ref(false)

  const setupEnv = async () => {
    const _env = await GetEnv()
    let appPath = `${_env.basePath}/${_env.appName}`
    if (_env.os === OS.Windows) {
      appPath = appPath.replaceAll('/', '\\')
    } else if (_env.os === OS.Darwin) {
      appPath = appPath.replace(`/Contents/MacOS/${_env.appName}`, '')
    }
    env.value = { ..._env, appPath }
  }

  const updateSystemProxyStatus = async () => {
    const proxyServer = (await ignoredError(GetSystemProxy)) || ''

    if (!proxyServer) {
      systemProxy.value = false
    } else {
      const kernelProxy = kernelApiStore.getProxyEndpoint()
      if (!kernelProxy) {
        systemProxy.value = false
        return systemProxy.value
      }

      const { host, port, proxyType } = kernelProxy
      const server = `${formatProxyHost(host)}:${port}`
      const proxyServerList = [
        `http://${server}`,
        `https://${server}`,
        `socks5://${server}`,
        `socks=${server}`,
      ]
      if (proxyType === 'mixed') {
        proxyServerList.push(
          `http://127.0.0.1:${port}`,
          `https://127.0.0.1:${port}`,
          `socks5://127.0.0.1:${port}`,
          `socks=127.0.0.1:${port}`,
        )
      }
      systemProxy.value = proxyServerList.includes(proxyServer)
    }

    return systemProxy.value
  }

  const setSystemProxy = async () => {
    const proxyBypassList = appSettings.app.proxyBypassList
    const services = appSettings.app.systemProxyServices
    let proxyEndpoint = kernelApiStore.getProxyEndpoint()
    if (!proxyEndpoint) {
      await kernelApiStore.updateConfig('inbound', undefined)
    }
    proxyEndpoint = kernelApiStore.getProxyEndpoint()
    if (!proxyEndpoint) throw 'home.overview.needPort'
    const server = `${formatProxyHost(proxyEndpoint.host)}:${proxyEndpoint.port}`
    await SetSystemProxy(true, server, proxyEndpoint.proxyType, proxyBypassList, services)
    systemProxy.value = true
  }

  const clearSystemProxy = async () => {
    const proxyBypassList = appSettings.app.proxyBypassList
    const services = appSettings.app.systemProxyServices
    await SetSystemProxy(false, '', undefined, proxyBypassList, services)
    systemProxy.value = false
  }

  const switchSystemProxy = async (enable: boolean) => {
    if (enable) await setSystemProxy()
    else await clearSystemProxy()
  }

  const setSystemDNS = async (proxy: boolean) => {
    const supportedSystems: App.OS[] = [OS.Linux, OS.Darwin]
    if (!supportedSystems.includes(env.value.os)) return
    const servers = proxy ? appSettings.app.systemProxyDNS : appSettings.app.systemDefaultDNS
    await SetSystemDNS(servers, appSettings.app.systemProxyServices)
    systemDNSSet.value = proxy
  }

  watch(systemProxy, updateTrayAndMenus)

  return {
    env,
    setupEnv,
    systemProxy,
    systemDNSSet,
    setSystemProxy,
    clearSystemProxy,
    switchSystemProxy,
    updateSystemProxyStatus,
    setSystemDNS,
  }
})
