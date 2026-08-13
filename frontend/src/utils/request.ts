import { GetSystemProxy } from '@/bridge/app'

import { RequestProxyMode } from '@/enums/app'
import { useAppSettingsStore } from '@/stores/appSettings'
import { useKernelApiStore } from '@/stores/kernelApi'

import { formatProxyHost } from './format'
import { normalizeRequestProxy } from './normalize'

const requestProxyCache: { proxyPromise: Promise<string> | null; lastAccessTime: number } = {
  proxyPromise: null,
  lastAccessTime: 0,
}

export const GetRequestProxy = async (mode?: App.RequestProxyMode, customProxy?: string) => {
  const appSettings = useAppSettingsStore()
  const requestProxyMode = mode ?? appSettings.app.requestProxyMode

  if (requestProxyMode === RequestProxyMode.None) {
    return ''
  }

  if (requestProxyMode === RequestProxyMode.Kernel) {
    const kernelProxy = useKernelApiStore().getProxyEndpoint()
    if (!kernelProxy) return ''

    const { schema, host, port, username, password } = kernelProxy
    const formattedHost = formatProxyHost(host)
    const encodedUsername = encodeURIComponent(username)
    const encodedPassword = password ? `:${encodeURIComponent(password)}` : ''
    const auth = username || password ? `${encodedUsername}${encodedPassword}@` : ''

    return `${schema}://${auth}${formattedHost}:${port}`
  }

  if (requestProxyMode === RequestProxyMode.Custom) {
    return normalizeRequestProxy(customProxy ?? appSettings.app.customProxy)
  }

  if (requestProxyCache.proxyPromise && Date.now() - requestProxyCache.lastAccessTime < 1000) {
    return requestProxyCache.proxyPromise
  }

  requestProxyCache.lastAccessTime = Date.now()
  requestProxyCache.proxyPromise = GetSystemProxy().catch(() => '')
  return requestProxyCache.proxyPromise
}
