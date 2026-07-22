import type * as Vue from 'vue'

import type {
  Branch,
  Color,
  ControllerCloseMode,
  Lang,
  OS,
  PluginTrigger,
  RequestMethod,
  RequestProxyMode,
  RuleSetFormat,
  ScheduledTasksType,
  Theme,
  View,
  WebviewGpuPolicy,
  WindowStartState,
} from '@/enums'

import type { Recordable } from './utils'

export interface AppEnv {
  appName: string
  appVersion: string
  basePath: string
  appPath: string
  appDataPath: string
  appConfigPath: string
  appCachePath: string
  appCorePath: string
  os: OS
  arch: string
  isPrivileged: boolean
  isSystemPackage: boolean
  isBundled: boolean
}

export interface TrayContent {
  icon?: string
  title?: string
  tooltip?: string
}

export interface ComponentOption {
  label: string
  value: string
}

export interface Menu {
  label: string
  handler?: (...args: any) => void
  separator?: boolean
  children?: Menu[]
}

export interface MenuItem {
  type: 'item' | 'separator'
  text?: string
  tooltip?: string
  event?: (() => void) | string
  children?: MenuItem[]
  hidden?: boolean
  checked?: boolean
  checkable?: boolean
}

export interface AppSettings {
  lang: Lang
  theme: Theme
  color: Color
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  systemTitleBar: boolean
  profilesView: View
  subscribesView: View
  rulesetsView: View
  pluginsView: View
  scheduledtasksView: View
  windowStartState: WindowStartState
  webviewGpuPolicy: WebviewGpuPolicy
  contentProtection: boolean
  width: number
  height: number
  exitOnClose: boolean
  closeKernelOnExit: boolean
  autoSetSystemProxy: boolean
  autoSetSystemDNS: boolean
  requestProxyMode: RequestProxyMode
  customProxy: string
  proxyBypassList: string
  systemProxyServices: string[]
  systemProxyDNS: string
  systemDefaultDNS: string
  autoStartKernel: boolean
  autoRestartKernel: boolean
  userAgent: string
  startupDelay: number
  connections: {
    visibility: Record<string, boolean>
    order: string[]
  }
  kernel: {
    realMemoryUsage: boolean
    branch: Branch
    profile: string
    autoClose: boolean
    unAvailable: boolean
    cardMode: boolean
    cardColumns: number
    sortByDelay: boolean
    testUrl: string
    testTimeout: number
    concurrencyLimit: number
    controllerCloseMode: ControllerCloseMode
    controllerSensitivity: number
    main: {
      env: Recordable
      args: string[]
    }
    alpha: {
      env: Recordable
      args: string[]
    }
  }
  plugins: {
    sources: { enable: boolean; name: string; url: string }[]
  }
  addPluginToMenu: boolean
  addGroupToMenu: boolean
  pluginSettings: Record<string, Record<string, any>>
  githubApiToken: string
  githubDownloadAcceleration: boolean
  githubDownloadMirror: string
  multipleInstance: boolean
  rollingRelease: boolean
  debugOutline: boolean
  debugNoAnimation: boolean
  debugNoRounded: boolean
  debugBorder: boolean
  debugUsePointer: boolean
  pages: string[]
}

export interface AppPlugin {
  id: string
  version: string
  name: string
  description: string
  type: 'Http' | 'File'
  url: string
  path: string
  triggers: PluginTrigger[]
  tags: string[]
  hasUI: boolean
  group: string
  menus: Record<string, string>
  context: {
    profiles: Recordable
    subscriptions: Recordable
    rulesets: Recordable
    plugins: Recordable
    scheduledtasks: Recordable
  }
  configuration: {
    id: string
    title: string
    description: string
    key: string
    component:
      | 'CheckBox'
      | 'CodeEditor'
      | 'Input'
      | 'InputList'
      | 'KeyValueEditor'
      | 'Radio'
      | 'Select'
      | 'MultipleSelect'
      | 'Switch'
      | 'ColorPicker'
      | ''
    value: any
    options: any[]
  }[]
  disabled: boolean
  status: number // 0: Normal 1: Running 2: Stopped
  // Not Config
  updating?: boolean
  loading?: boolean
  running?: boolean
}

export interface Subscription {
  id: string
  name: string
  upload: number
  download: number
  total: number
  expire: number
  updateTime: number
  type: 'Http' | 'File' | 'Manual'
  url: string
  website: string
  path: string
  include: string
  exclude: string
  includeProtocol: string
  excludeProtocol: string
  proxyPrefix: string
  requestProxyMode: RequestProxyMode
  customProxy: string
  disabled: boolean
  inSecure: boolean
  proxies: { id: string; tag: string; type: string }[]
  requestMethod: RequestMethod
  requestTimeout: number
  header: {
    request: Recordable
    response: Recordable
  }
  script: string
  // Not Config
  updating?: boolean
}

export interface RuleSet {
  id: string
  name: string
  updateTime: number
  disabled: boolean
  type: 'Http' | 'File' | 'Manual'
  format: RuleSetFormat
  path: string
  url: string
  count: number
  // Not Config
  updating?: boolean
}

export interface RuleSetHub {
  geosite: string
  geoip: string
  list: { name: string; type: 'geosite' | 'geoip'; description: string; count: number }[]
}

export interface ScheduledTask {
  id: string
  name: string
  type: ScheduledTasksType
  subscriptions: string[]
  rulesets: string[]
  plugins: string[]
  script: string
  cron: string
  notification: boolean
  disabled: boolean
  lastTime: number
}

export interface CustomActionApi {
  h: typeof Vue.h
  ref: typeof Vue.ref
}

export type CustomActionProps = Recordable
export type CustomActionSlot = Vue.VNode | string | number | boolean
export type CustomActionSlots = Recordable<
  ((api: CustomActionApi) => CustomActionSlot) | CustomActionSlot
>

export interface CustomAction<P = CustomActionProps, S = CustomActionSlots> {
  id?: string
  component: string
  componentProps?: P | ((api: CustomActionApi) => P)
  componentSlots?: S | ((api: CustomActionApi) => S)
}

export type CustomActionFn = ((api: CustomActionApi) => CustomAction) & {
  id?: string
}
