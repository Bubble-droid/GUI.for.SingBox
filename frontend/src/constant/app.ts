import { APP_TITLE } from '@/utils/env'

import type { ValueOf } from '@/types/utils'

export const OS = {
  Windows: 'windows',
  Linux: 'linux',
  Darwin: 'darwin',
} as const

export type OS = ValueOf<typeof OS>

export const WindowStartState = {
  Normal: 0,
  Minimised: 2,
} as const

export type WindowStartState = ValueOf<typeof WindowStartState>

export const WebviewGpuPolicy = {
  Always: 0,
  OnDemand: 1,
  Never: 2,
} as const

export type WebviewGpuPolicy = ValueOf<typeof WebviewGpuPolicy>

export const Theme = {
  Auto: 'auto',
  Light: 'light',
  Dark: 'dark',
} as const

export type Theme = ValueOf<typeof Theme>

export const Lang = {
  EN: 'en',
  ZH: 'zh',
} as const

export type Lang = ValueOf<typeof Lang>

export const View = {
  Grid: 'grid',
  List: 'list',
} as const

export type View = ValueOf<typeof View>

export const ControllerCloseMode = {
  All: 'all',
  Button: 'button',
} as const

export type ControllerCloseMode = ValueOf<typeof ControllerCloseMode>

export const Color = {
  Default: 'default',
  Green: 'green',
  Purple: 'purple',
  Custom: 'custom',
} as const

export type Color = ValueOf<typeof Color>

export const Branch = {
  Main: 'main',
  Alpha: 'alpha',
} as const

export type Branch = ValueOf<typeof Branch>

export const RequestProxyMode = {
  Global: 'global',
  None: 'none',
  System: 'system',
  Kernel: 'kernel',
  Custom: 'custom',
} as const

export type RequestProxyMode = ValueOf<typeof RequestProxyMode>

export const ScheduledTasksType = {
  UpdateSubscription: 'update::subscription',
  UpdateRuleset: 'update::ruleset',
  UpdatePlugin: 'update::plugin',
  UpdateAllSubscription: 'update::all::subscription',
  UpdateAllRuleset: 'update::all::ruleset',
  UpdateAllPlugin: 'update::all::plugin',
  RunPlugin: 'run::plugin',
  RunScript: 'run::script',
} as const

export type ScheduledTasksType = ValueOf<typeof ScheduledTasksType>

export const PluginTrigger = {
  OnEnabled: 'on::enabled',
  OnDisabled: 'on::disabled',
  OnManual: 'on::manual',
  OnSubscribe: 'on::subscribe',
  OnGenerate: 'on::generate',
  OnStartup: 'on::startup',
  OnShutdown: 'on::shutdown',
  OnReady: 'on::ready',
  OnReload: 'on::reload',
  OnCoreStarted: 'on::core::started',
  OnCoreStopped: 'on::core::stopped',
  OnBeforeCoreStart: 'on::before::core::start',
  OnBeforeCoreStop: 'on::before::core::stop',
  OnTrayUpdate: 'on::tray::update',
} as const

export type PluginTrigger = ValueOf<typeof PluginTrigger>

export const PluginTriggerEvent = {
  OnEnabled: 'onEnabled',
  OnDisabled: 'onDisabled',
  OnDispose: 'onDispose',
  OnInstall: 'onInstall',
  OnUninstall: 'onUninstall',
  OnManual: 'onRun',
  OnTrayUpdate: 'onTrayUpdate',
  OnSubscribe: 'onSubscribe',
  OnGenerate: 'onGenerate',
  OnStartup: 'onStartup',
  OnShutdown: 'onShutdown',
  OnReady: 'onReady',
  OnReload: 'onReload',
  OnTask: 'onTask',
  OnConfigure: 'onConfigure',
  OnCoreStarted: 'onCoreStarted',
  OnCoreStopped: 'onCoreStopped',
  OnBeforeCoreStart: 'onBeforeCoreStart',
  OnBeforeCoreStop: 'onBeforeCoreStop',
} as const

export type PluginTriggerEvent = ValueOf<typeof PluginTriggerEvent>

export const RequestMethod = {
  Get: 'GET',
  Post: 'POST',
  Delete: 'DELETE',
  Put: 'PUT',
  Head: 'HEAD',
  Patch: 'PATCH',
} as const

export type RequestMethod = ValueOf<typeof RequestMethod>

export const LocalesFilePath = 'data/locales'

export const UserFilePath = 'data/user.yaml'

export const ProfilesFilePath = 'data/profiles.yaml'

export const SubscribesFilePath = 'data/subscribes.yaml'

export const RulesetsFilePath = 'data/rulesets.yaml'

export const PluginsFilePath = 'data/plugins.yaml'

export const ScheduledTasksFilePath = 'data/scheduledtasks.yaml'

export const PluginHubFilePath = 'data/.cache/plugin-list.json'

export const RulesetHubFilePath = 'data/.cache/ruleset-list.json'

export const DefaultFontFamily =
  'system-ui, "Microsoft YaHei UI", "Source Han Sans CN", "Twemoji Mozilla", sans-serif'

export const Colors = {
  [Color.Default]: {
    primary: 'rgb(0, 89, 214)',
    secondary: 'rgb(5, 62, 142)',
  },
  [Color.Green]: {
    primary: 'green',
    secondary: '#025f02',
  },
  [Color.Purple]: {
    primary: 'purple',
    secondary: '#6a0f9c',
  },
  [Color.Custom]: {
    primary: '#000',
    secondary: '#000',
  },
}

export const LanguageOptions = [
  { label: 'settings.lang.zh', value: Lang.ZH },
  { label: 'settings.lang.en', value: Lang.EN },
]

export const ViewOptions = [
  { label: 'common.grid', value: View.Grid },
  { label: 'common.list', value: View.List },
]

export const ControllerCloseModeOptions = [
  { label: 'home.controller.closeMode.all', value: ControllerCloseMode.All },
  { label: 'home.controller.closeMode.button', value: ControllerCloseMode.Button },
]

export const RequestMethodOptions = [
  { label: RequestMethod.Get, value: RequestMethod.Get },
  { label: RequestMethod.Post, value: RequestMethod.Post },
  { label: RequestMethod.Delete, value: RequestMethod.Delete },
  { label: RequestMethod.Put, value: RequestMethod.Put },
  { label: RequestMethod.Head, value: RequestMethod.Head },
  { label: RequestMethod.Patch, value: RequestMethod.Patch },
]

export const RequestProxyModeOptions = [
  { label: 'settings.requestProxy.none', value: RequestProxyMode.None },
  { label: 'settings.requestProxy.system', value: RequestProxyMode.System },
  { label: 'settings.requestProxy.kernel', value: RequestProxyMode.Kernel },
  { label: 'settings.requestProxy.custom', value: RequestProxyMode.Custom },
]

export const SubscriptionRequestProxyModeOptions = [
  { label: 'settings.requestProxy.global', value: RequestProxyMode.Global },
  ...RequestProxyModeOptions,
]

export const ThemeOptions = [
  {
    label: 'settings.theme.dark',
    value: Theme.Dark,
  },
  {
    label: 'settings.theme.light',
    value: Theme.Light,
  },
  {
    label: 'settings.theme.auto',
    value: Theme.Auto,
  },
]

export const ColorOptions = [
  {
    label: 'settings.color.default',
    value: Color.Default,
  },
  {
    label: 'settings.color.green',
    value: Color.Green,
  },
  {
    label: 'settings.color.purple',
    value: Color.Purple,
  },
  {
    label: 'settings.color.custom',
    value: Color.Custom,
  },
]

export const WindowStateOptions = [
  { label: 'settings.windowState.normal', value: WindowStartState.Normal },
  { label: 'settings.windowState.minimised', value: WindowStartState.Minimised },
]

export const WebviewGpuPolicyOptions = [
  { label: 'settings.webviewGpuPolicy.always', value: WebviewGpuPolicy.Always },
  { label: 'settings.webviewGpuPolicy.onDemand', value: WebviewGpuPolicy.OnDemand },
  { label: 'settings.webviewGpuPolicy.never', value: WebviewGpuPolicy.Never },
]

export const DefaultPluginHubSources = () => [
  {
    enable: true,
    name: 'General',
    url: 'https://raw.githubusercontent.com/GUI-for-Cores/Plugin-Hub/main/plugins/generic.json',
  },
  {
    enable: true,
    name: APP_TITLE,
    url: `https://raw.githubusercontent.com/GUI-for-Cores/Plugin-Hub/main/plugins/${
      {
        'GUI.for.Clash': 'gfc',
        'GUI.for.SingBox': 'gfs',
      }[APP_TITLE]
    }.json`,
  },
]

// vue-draggable-plus config
export const DraggableOptions = {
  animation: 150,
}

export const PluginsTriggerOptions = [
  { label: 'plugin.on::startup', value: PluginTrigger.OnStartup },
  { label: 'plugin.on::ready', value: PluginTrigger.OnReady },
  { label: 'plugin.on::reload', value: PluginTrigger.OnReload },
  { label: 'plugin.on::shutdown', value: PluginTrigger.OnShutdown },
  { label: 'plugin.on::manual', value: PluginTrigger.OnManual },
  { label: 'plugin.on::generate', value: PluginTrigger.OnGenerate },
  { label: 'plugin.on::subscribe', value: PluginTrigger.OnSubscribe },
  { label: 'plugin.on::tray::update', value: PluginTrigger.OnTrayUpdate },
  { label: 'plugin.on::before::core::start', value: PluginTrigger.OnBeforeCoreStart },
  { label: 'plugin.on::core::started', value: PluginTrigger.OnCoreStarted },
  { label: 'plugin.on::before::core::stop', value: PluginTrigger.OnBeforeCoreStop },
  { label: 'plugin.on::core::stopped', value: PluginTrigger.OnCoreStopped },
]

export const ScheduledTaskOptions = [
  { label: 'scheduledtask.update::subscription', value: ScheduledTasksType.UpdateSubscription },
  { label: 'scheduledtask.update::ruleset', value: ScheduledTasksType.UpdateRuleset },
  { label: 'scheduledtask.update::plugin', value: ScheduledTasksType.UpdatePlugin },
  { label: 'scheduledtask.run::plugin', value: ScheduledTasksType.RunPlugin },
  { label: 'scheduledtask.run::script', value: ScheduledTasksType.RunScript },
  {
    label: 'scheduledtask.update::all::subscription',
    value: ScheduledTasksType.UpdateAllSubscription,
  },
  { label: 'scheduledtask.update::all::ruleset', value: ScheduledTasksType.UpdateAllRuleset },
  { label: 'scheduledtask.update::all::plugin', value: ScheduledTasksType.UpdateAllPlugin },
]

export const DefaultSubscribeScript = `const onSubscribe = async (proxies, subscription) => {\n  return { proxies, subscription }\n}`

export const DefaultTestURL = 'https://www.gstatic.com/generate_204'

export const DefaultTestTimeout = 5000

export const DefaultConcurrencyLimit = 20

export const DefaultCardColumns = 5

export const DefaultControllerSensitivity = 2

export const ProfileSteps = [
  'Name',
  'Log',
  'Ntp',
  'Experimental',
  'Certificate',
  'CertProviders',
  'HttpClients',
  'Netns',
  'Endpoints',
  'Inbounds',
  'Outbounds',
  'Route',
  'Dns',
  'MixinScript',
] as const

export const ProfileStep = Object.fromEntries(
  ProfileSteps.map((step, index) => [step, index]),
) as Record<(typeof ProfileSteps)[number], number>

export const ProfileMenuList = ProfileSteps.map((step) => {
  if (step === 'CertProviders') {
    return 'profile.step.certificate_providers'
  } else if (step === 'HttpClients') {
    return 'profile.step.http_clients'
  } else if (step === 'MixinScript') {
    return 'profile.step.mixin-script'
  } else {
    return `profile.step.${step.toLowerCase()}`
  }
}) as `profile.step.${Lowercase<(typeof ProfileSteps)[number]>}`[]

export const ProfileStepItems = ProfileMenuList.map((v) => ({ title: v }))
