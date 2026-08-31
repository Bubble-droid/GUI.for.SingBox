import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { Exec } from '@/bridge/exec'
import { ReadDir, RemoveFile, UnzipZIPFile, UnzipTarGZFile, MoveFile } from '@/bridge/io'
import { HttpCancel, Download, HttpGet } from '@/bridge/net'

import { LanguageOptions, LocalesFilePath, RollingReleaseDirectory, OS } from '@/constant/app'
import { loadLocale } from '@/lang'
import { APP_VERSION, APP_VERSION_API, APP_ID } from '@/utils/env'
import { confirm, message } from '@/utils/interaction'
import { sleep, sampleID, getGitHubApiAuthorization } from '@/utils/others'

import type { App } from '@/types'
import type { GitHubApiRelease } from '@/types/github'

import { StoreDep, useStoreDeps } from './deps'

export const useAppStore = defineStore('app', () => {
  const isAppExiting = ref(false)
  const isAppReloading = ref(false)

  /* Global Menu */
  const menuShow = ref(false)
  const menuList = ref<App.Menu[]>([])
  const menuPosition = ref({
    x: 0,
    y: 0,
  })

  /* Global Tips */
  const tipsShow = ref(false)
  const tipsMessage = ref('')
  const tipsPosition = ref({
    x: 0,
    y: 0,
  })

  /* i18n */
  const localesLoading = ref(false)
  const locales = ref<{ label: string; value: string }[]>([])
  const loadLocales = async (delay = true, reload = true) => {
    localesLoading.value = true
    const dirs = await ReadDir(LocalesFilePath).catch(() => [])
    const localLanguage = dirs.flatMap((file) => {
      if (file.isDir) {
        return []
      }
      const [name, ext] = file.name.split('.')
      return name && ext === 'json' ? { label: name, value: name } : []
    })
    locales.value = [...LanguageOptions, ...localLanguage]
    reload && (await loadLocale())
    delay && (await sleep(200))
    localesLoading.value = false
  }

  /* Actions */
  const customActions = ref({
    core_state: [] as (App.CustomAction | App.CustomActionFn)[],
    title_bar: [] as (App.CustomAction | App.CustomActionFn)[],
    profiles_header: [] as (App.CustomAction | App.CustomActionFn)[],
    subscriptions_header: [] as (App.CustomAction | App.CustomActionFn)[],
  })
  const addCustomActions = (
    target: keyof typeof customActions.value,
    actions: App.CustomAction | App.CustomAction[] | App.CustomActionFn | App.CustomActionFn[],
  ) => {
    if (!customActions.value[target]) {
      throw new Error(`Target does not exist: ${target}`)
    }
    const _actions = Array.isArray(actions) ? actions : [actions]
    _actions.forEach((action) => {
      action.id ??= sampleID()
    })
    customActions.value[target].push(..._actions)
    const remove = () => {
      customActions.value[target] = customActions.value[target].filter(
        (a) => !_actions.some((added) => added.id === a.id),
      )
    }
    return remove
  }
  const removeCustomActions = (target: keyof typeof customActions.value, id: string | string[]) => {
    if (!customActions.value[target]) {
      throw new Error(`Target does not exist: ${target}`)
    }
    const ids = Array.isArray(id) ? id : [id]
    customActions.value[target] = customActions.value[target].filter((a) => !ids.includes(a.id!))
  }

  const { t } = useI18n()
  const envStore = useStoreDeps(StoreDep.EnvStore)
  const appSettingsStore = useStoreDeps(StoreDep.AppSettingsStore)

  /* About Page */
  const showAbout = ref(false)
  const lastCheckTime = ref(0)
  const checkForUpdatesLoading = ref(false)
  const restartable = ref(false)
  const downloading = ref(false)
  const downloadUrl = ref('')
  const downloadDigest = ref('')
  const remoteVersion = ref(APP_VERSION)
  const updatable = computed(() => downloadUrl.value && APP_VERSION !== remoteVersion.value)

  const downloadApp = async () => {
    if (envStore.env.isSystemPackage) {
      message.info('about.updatesManagedByOS')
      return
    }
    downloading.value = true
    const { os, appPath } = envStore.env
    try {
      const downloadCacheFile = `data/.cache/gui${os === OS.Windows ? '.zip' : '.tar.gz'}`

      const { update, destroy } = message.info('common.downloading', 10 * 60 * 1_000, () => {
        HttpCancel(downloadCacheFile)
        setTimeout(() => RemoveFile(downloadCacheFile), 1000)
      })

      await Download(
        downloadUrl.value,
        downloadCacheFile,
        undefined,
        (progress, total) => {
          update(`${t('common.downloading') + ((progress / total) * 100).toFixed(2)}%`)
        },
        {
          CancelId: downloadCacheFile,
          Sha256: downloadDigest.value.slice(7),
        },
      ).finally(destroy)

      if (os === OS.Windows) {
        await UnzipZIPFile(downloadCacheFile, 'data/.cache')
      } else {
        await UnzipTarGZFile(downloadCacheFile, 'data/.cache')
      }

      if (os === OS.Darwin) {
        const cur_pkg_bak = `${appPath}.bak`
        await RemoveFile(downloadCacheFile)
        await MoveFile(appPath, cur_pkg_bak)
        await MoveFile(`${cur_pkg_bak}/Contents/MacOS/data/.cache/${APP_ID}.app`, appPath)
        await Exec('xattr', ['-rd', 'com.apple.quarantine', appPath])
        await RemoveFile(`${cur_pkg_bak}/Contents/MacOS/${RollingReleaseDirectory}`)
        await RemoveFile(cur_pkg_bak)
      } else {
        const suffix = { [OS.Windows]: '.exe', [OS.Linux]: '' }[os]
        await MoveFile(appPath, `data/.cache/${APP_ID}.bak`)
        await MoveFile(`data/.cache/${APP_ID}${suffix}`, appPath)
        await RemoveFile(downloadCacheFile)
        await RemoveFile(RollingReleaseDirectory)
      }
      message.success('about.updateSuccessfulRestart')
      restartable.value = true
    } catch (error) {
      console.log(error)
      message.error(error, 5_000)
    }
    downloading.value = false
  }

  const checkForUpdates = async (showTips = false) => {
    if (checkForUpdatesLoading.value || downloading.value) {
      return
    }
    if (envStore.env.isSystemPackage) {
      if (showTips) {
        message.info('about.updatesManagedByOS')
      }
      return
    }
    checkForUpdatesLoading.value = true
    remoteVersion.value = APP_VERSION
    downloadDigest.value = ''
    try {
      const response = await HttpGet(APP_VERSION_API, {
        Authorization: getGitHubApiAuthorization(appSettingsStore.app),
      })
      const body = response.body as GitHubApiRelease
      if (body.message) {
        throw new Error(body.message)
      }

      const { tag_name, assets } = body

      const { os, arch } = envStore.env
      const assetName = `${APP_ID}-${tag_name.replace(/^v/u, '')}-${os}-${arch}${os === OS.Windows ? '.zip' : '.tar.gz'}`

      const asset = assets.find((v) => v.name === assetName)
      if (!asset) {
        throw new Error(`Asset Not Found: ${assetName}`)
      }
      if (asset.uploader.login !== 'github-actions[bot]') {
        await confirm('common.warning', 'settings.kernel.risk', {
          type: 'text',
          okText: 'settings.kernel.stillDownload',
        })
      }

      remoteVersion.value = tag_name
      downloadUrl.value = asset.browser_download_url
      downloadDigest.value = asset.digest

      if (showTips) {
        message.info(updatable.value ? 'about.newVersion' : 'about.latestVersion')
      }
    } catch (error) {
      console.error(error)
      message.error(error)
    }
    lastCheckTime.value = Date.now()
    checkForUpdatesLoading.value = false
  }

  return {
    isAppExiting,
    isAppReloading,
    menuShow,
    menuPosition,
    menuList,
    tipsShow,
    tipsMessage,
    tipsPosition,
    showAbout,
    lastCheckTime,
    checkForUpdatesLoading,
    restartable,
    downloading,
    remoteVersion,
    updatable,
    checkForUpdates,
    downloadApp,
    customActions,
    addCustomActions,
    removeCustomActions,
    localesLoading,
    locales,
    loadLocales,
  }
})
