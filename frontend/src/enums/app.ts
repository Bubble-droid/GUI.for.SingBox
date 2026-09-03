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
