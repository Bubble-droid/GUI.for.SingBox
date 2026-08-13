import { RuleSetFormat } from '@features/constant/kernel'

import { GetEnv, ExitApp } from '@/bridge/app'
import { Exec } from '@/bridge/exec'
import { AbsolutePath, FileExists, WriteFile, RemoveFile, ReadFile } from '@/bridge/io'
import { WindowReloadApp } from '@wails/runtime/runtime'

import { deleteConnection, getConnections, useProxy } from '@/api/kernel'
import { OS } from '@/enums/app'
import i18n from '@/lang'
import { StoreDep, useStoreDeps } from '@/stores/deps'

import { APP_TITLE } from './env'
import { confirm, message } from './interaction'
import { getAutoStartConfiguration, ignoredError } from './others'

// Permissions Helper
export const SwitchPermissions = async (enable: boolean) => {
  const { appPath } = useStoreDeps(StoreDep.EnvStore).env
  const args = enable
    ? [
        'add',
        'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers',
        '/v',
        appPath,
        '/t',
        'REG_SZ',
        '/d',
        'RunAsAdmin',
        '/f',
      ]
    : [
        'delete',
        'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers',
        '/v',
        appPath,
        '/f',
      ]
  await Exec('reg', args)
}

export const CheckPermissions = async () => {
  const { appPath } = useStoreDeps(StoreDep.EnvStore).env
  try {
    const out = await Exec('reg', [
      'query',
      'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers',
      '/v',
      appPath,
      '/t',
      'REG_SZ',
    ])
    return out.includes('RunAsAdmin')
  } catch {
    return false
  }
}

export const GrantTUNPermission = async (path: string) => {
  const { os } = useStoreDeps(StoreDep.EnvStore).env
  const absPath = await AbsolutePath(path)
  if (os === OS.Darwin) {
    const command = `chown root:admin "${absPath}"; chmod +sx "${absPath}"`
    await RunWithOsaScript(command, [], { admin: true, wait: true })
  } else if (os === OS.Linux) {
    await Exec('pkexec', ['setcap', 'cap_net_admin,cap_net_raw,cap_net_bind_service=ep', absPath])
  }
}

export const RunWithOsaScript = async (
  path: string,
  args: string[] = [],
  options: { admin?: boolean; wait?: boolean } = {},
) => {
  const { admin = false, wait = true, ...others } = options
  const escapedArgs = args.map((arg) => `'${arg.replace(/'/g, "'\\''")}'`).join(' ')
  let shellCmd = `${path} ${escapedArgs}`.trim()
  if (!wait) {
    shellCmd += ' > /dev/null 2>&1 &'
  }
  const escapedShellCmd = shellCmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  let appleScript = `do shell script "${escapedShellCmd}"`
  if (admin) {
    appleScript += ' with administrator privileges'
  }
  const osaArgs = ['-e', appleScript]
  return await Exec('osascript', osaArgs, others)
}

export const RunWithPowerShell = async (
  path: string,
  args: string[] = [],
  options: { admin?: boolean; hidden?: boolean; wait?: boolean } = {},
) => {
  const { admin = false, hidden = false, wait = true, ...others } = options
  const psArgs: string[] = []
  let command = `Start-Process -FilePath "${path}"`
  if (args.length > 0) {
    const argList = args.map((a) => `"${a.replace(/"/g, '""')}"`).join(',')
    command += ` -ArgumentList ${argList}`
  }
  if (admin) {
    command += ' -Verb RunAs'
  }
  if (hidden) {
    command += ' -WindowStyle Hidden'
  }
  if (wait) {
    command += ' -Wait'
  }
  psArgs.push('-NoProfile', '-Command', command)
  return await Exec('powershell', psArgs, others)
}

// Auto-start
const getPlistPath = async () => {
  const home = await GetEnv('HOME')
  return `${home}/Library/LaunchAgents/${APP_TITLE}.plist`
}

const getDesktopPath = async () => {
  const home = await GetEnv('HOME')
  return `${home}/.config/autostart/${APP_TITLE}.desktop`
}

export const IsAutoStartEnabled = async () => {
  const { os } = useStoreDeps(StoreDep.EnvStore).env
  let isAutoStart = false
  if (os === OS.Windows) {
    isAutoStart = await Exec('Schtasks', ['/Query', '/TN', APP_TITLE, '/XML'])
      .then(() => true)
      .catch(() => false)
  } else if (os === OS.Darwin) {
    const plistPath = await getPlistPath()
    isAutoStart = await FileExists(plistPath)
  } else if (os === OS.Linux) {
    const desktopPath = await getDesktopPath()
    isAutoStart = await FileExists(desktopPath)
  }
  return isAutoStart
}

export const EnableAutoStart = async (delay = 10) => {
  const { os, appPath, isPrivileged } = useStoreDeps(StoreDep.EnvStore).env
  const configuration = getAutoStartConfiguration(os, appPath, delay)
  if (os === OS.Windows) {
    const xmlPath = await AbsolutePath('data/.cache/tasksch.xml')
    await WriteFile(xmlPath, configuration)
    const fn = isPrivileged ? Exec : RunWithPowerShell
    await fn('SchTasks', ['/Create', '/F', '/TN', APP_TITLE, '/XML', xmlPath], {
      admin: true,
      hidden: true,
    })
  } else if (os === OS.Darwin) {
    const plistPath = await getPlistPath()
    await WriteFile(plistPath, configuration)
    await Exec('launchctl', ['load', plistPath])
  } else if (os === OS.Linux) {
    const desktopPath = await getDesktopPath()
    await WriteFile(desktopPath, configuration)
  }
}

export const DisableAutoStart = async () => {
  const { os, isPrivileged } = useStoreDeps(StoreDep.EnvStore).env
  if (os === OS.Windows) {
    const fn = isPrivileged ? Exec : RunWithPowerShell
    await fn('SchTasks', ['/Delete', '/F', '/TN', APP_TITLE], { admin: true, hidden: true })
  } else if (os === OS.Darwin) {
    const plistPath = await getPlistPath()
    await Exec('launchctl', ['unload', plistPath])
    await RemoveFile(plistPath)
  } else if (os === OS.Linux) {
    const desktopPath = await getDesktopPath()
    await RemoveFile(desktopPath)
  }
}

// Others
export const handleUseProxy = async (group: any, proxy: any) => {
  if (group.type !== 'Selector' || group.now === proxy.name) return
  const promises: Promise<null>[] = []
  const appSettings = useStoreDeps(StoreDep.AppSettingsStore)
  const kernelApiStore = useStoreDeps(StoreDep.KernelApiStore)
  if (appSettings.app.kernel.autoClose) {
    const { connections } = await getConnections()
    promises.push(
      ...(connections || [])
        .filter((v) => v.chains.includes(group.name))
        .map((v) => deleteConnection(v.id)),
    )
  }
  await useProxy(encodeURIComponent(group.name), proxy.name)
  await Promise.all(promises)
  await kernelApiStore.refreshProviderProxies()
}

export const handleChangeMode = async (mode: 'direct' | 'global' | 'rule') => {
  const kernelApiStore = useStoreDeps(StoreDep.KernelApiStore)

  if (mode === kernelApiStore.config.mode) return

  void kernelApiStore.updateConfig('mode', mode)

  const { connections } = await getConnections()
  const promises = (connections || []).map((v) => deleteConnection(v.id))
  await Promise.all(promises)
}

export const addToRuleSet = async (
  id: 'direct' | 'reject' | 'proxy',
  payloads: Record<string, any>[],
) => {
  const path = `data/rulesets/${id}.json`

  const rulesetsStoe = useStoreDeps(StoreDep.RulesetsStore)
  let ruleset = rulesetsStoe.getRulesetById(id)
  if (!ruleset) {
    ruleset = {
      id,
      name: id,
      updateTime: 0,
      type: 'Manual',
      format: RuleSetFormat.Source,
      url: '',
      path,
      count: 0,
      disabled: false,
    }
    await rulesetsStoe.addRuleset(ruleset)
  }

  const content = (await ignoredError(ReadFile, path)) || '{ "version": 1, "rules": [] }'
  const { rules = [] } = JSON.parse(content)
  rules[0] = rules[0] || {}
  payloads.forEach((payload) => {
    if (payload['domain']) {
      rules[0].domain = [...new Set((rules[0].domain || []).concat(payload['domain']))]
    } else if (payload['ip_cidr']) {
      rules[0].ip_cidr = [...new Set((rules[0].ip_cidr || []).concat(payload['ip_cidr']))]
    } else if (payload['process_path']) {
      rules[0].process_path = [
        ...new Set((rules[0].process_path || []).concat(payload['process_path'])),
      ]
    } else if (payload['domain_suffix']) {
      rules[0].domain_suffix = [
        ...new Set((rules[0].domain_suffix || []).concat(payload['domain_suffix'])),
      ]
    }
  })
  await WriteFile(path, JSON.stringify({ version: 1, rules }, null, 2))
  await rulesetsStoe.updateRuleset(id)
}

export const reloadApp = async () => {
  const { t } = i18n.global
  const appStore = useStoreDeps(StoreDep.AppStore)
  const pluginsStore = useStoreDeps(StoreDep.PluginsStore)

  appStore.isAppReloading = true

  let timedout = false
  const { destroy } = message.info('titlebar.reloadPending', 10 * 60 * 1000)

  const timeoutId = setTimeout(async () => {
    timedout = true
    appStore.isAppReloading = false
    destroy()
    void confirm('Warning', t('titlebar.reloadTimeout')).then(WindowReloadApp)
  }, 10_000)

  try {
    await pluginsStore.onReloadTrigger()
    if (!timedout) {
      clearTimeout(timeoutId)
      WindowReloadApp()
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    void confirm('Error', t('titlebar.reloadError', { reason: err })).then(WindowReloadApp)
  }

  appStore.isAppReloading = false
  destroy()
}

export const exitApp = async () => {
  const { t } = i18n.global
  const appStore = useStoreDeps(StoreDep.AppStore)
  const envStore = useStoreDeps(StoreDep.EnvStore)
  const pluginsStore = useStoreDeps(StoreDep.PluginsStore)
  const appSettings = useStoreDeps(StoreDep.AppSettingsStore)
  const kernelApiStore = useStoreDeps(StoreDep.KernelApiStore)

  appStore.isAppExiting = true

  let timedout = false
  const { destroy } = message.info('titlebar.exitPending', 10 * 60 * 1000)

  const timeoutId = setTimeout(async () => {
    timedout = true
    appStore.isAppExiting = false
    destroy()
    void confirm('Warning', t('titlebar.exitTimeout')).then(ExitApp)
  }, 10_000)

  try {
    if (kernelApiStore.running && appSettings.app.closeKernelOnExit) {
      await kernelApiStore.stopCore()
      if (appSettings.app.autoSetSystemProxy) {
        await envStore.clearSystemProxy()
      }
    }
    await pluginsStore.onShutdownTrigger()
    if (!timedout) {
      clearTimeout(timeoutId)
      void ExitApp()
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    void confirm('Error', t('titlebar.exitError', { reason: err })).then(ExitApp)
  }

  appStore.isAppExiting = false
  destroy()
}

export const getKernelFileName = (isAlpha = false) => {
  const envStore = useStoreDeps(StoreDep.EnvStore)
  const { os } = envStore.env
  const fileSuffix = { windows: '.exe', linux: '', darwin: '' }[os]
  const latest = isAlpha ? '-latest' : ''
  return `sing-box${latest}${fileSuffix}`
}

export const getKernelAssetFileName = (version: string) => {
  const envStore = useStoreDeps(StoreDep.EnvStore)
  const { os, arch } = envStore.env
  const suffix = { windows: '.zip', linux: '.tar.gz', darwin: '.tar.gz' }[os]
  return `sing-box-${version}-${os}-${arch}${suffix}`
}

export const processMagicVariables = (str: string) => {
  const { env } = useStoreDeps(StoreDep.EnvStore)
  let result = str
  Object.entries({
    $CORE_BASE_PATH: `${env.appDataPath}/sing-box`,
  }).forEach(([source, target]) => {
    result = result.replaceAll(source, target)
  })
  return result
}

export const getKernelRuntimeEnv = (isAlpha = false) => {
  const appSettings = useStoreDeps(StoreDep.AppSettingsStore)
  const { env } = isAlpha ? appSettings.app.kernel.alpha : appSettings.app.kernel.main
  return Object.entries(env).reduce((p, [key, value]) => {
    p[key] = processMagicVariables(value)
    return p
  }, {} as Recordable)
}

export const getKernelRuntimeArgs = (isAlpha = false) => {
  const appSettings = useStoreDeps(StoreDep.AppSettingsStore)
  const { args } = isAlpha ? appSettings.app.kernel.alpha : appSettings.app.kernel.main
  return args.map((arg) => processMagicVariables(arg))
}
