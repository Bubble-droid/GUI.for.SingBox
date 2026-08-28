// oxlint-disable unicorn/consistent-function-scoping
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Exec } from '@/bridge/exec'
import {
  RemoveFile,
  MakeDir,
  MoveFile,
  UnzipZIPFile,
  UnzipTarGZFile,
  AbsolutePath,
  OpenDir,
  FileExists,
} from '@/bridge/io'
import { HttpGet, HttpCancel, Download } from '@/bridge/net'
import { BrowserOpenURL } from '@wails/runtime/runtime'

import { Branch, OS } from '@/constant/app'
import { CoreWorkingDirectory } from '@/constant/kernel'
import { useAppSettingsStore } from '@/stores/appSettings'
import { useEnvStore } from '@/stores/env'
import { useKernelApiStore } from '@/stores/kernelApi'
import { getKernelFileName, getKernelAssetFileName, GrantTUNPermission } from '@/utils/helper'
import { confirm, message } from '@/utils/interaction'
import { getGitHubApiAuthorization, ignoredError, debounce } from '@/utils/others'

import type { GitHubApiRelease } from '@/types/github'

const StableUrl = 'https://api.github.com/repos/SagerNet/sing-box/releases/latest'
const AlphaUrl = 'https://api.github.com/repos/SagerNet/sing-box/releases?per_page=3'

const StablePage = 'https://github.com/SagerNet/sing-box/releases/latest'
const AlphaPage = 'https://github.com/SagerNet/sing-box/releases'

export const useCoreBranch = (isAlpha = false) => {
  const releaseUrl = isAlpha ? AlphaUrl : StableUrl

  const localVersion = ref('')
  const remoteVersion = ref('')
  const versionDetail = ref('')

  const localVersionLoading = ref(false)
  const remoteVersionLoading = ref(false)
  const downloading = ref(false)
  const downloadCompleted = ref(false)
  const downloadProgress = ref('')
  const cancelDownload = ref<() => void>()

  const rollbackable = ref(false)

  const { t } = useI18n()
  const envStore = useEnvStore()
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()

  const restartable = computed(() => {
    const { branch } = appSettings.app.kernel
    if (!kernelApiStore.running) {
      return false
    }
    return localVersion.value && downloadCompleted.value && (branch === Branch.Alpha) === isAlpha
  })

  const updatable = computed(
    () => remoteVersion.value && localVersion.value !== remoteVersion.value,
  )

  const grantable = computed(() => localVersion.value && envStore.env.os !== OS.Windows)

  const CoreFilePath = `${CoreWorkingDirectory}/${getKernelFileName(isAlpha)}`
  const CoreBakFilePath = `${CoreFilePath}.bak`

  const downloadCore = async () => {
    if (envStore.env.isBundled) {
      message.info('about.updatesManagedByOS')
      return
    }
    downloading.value = true
    downloadProgress.value = ''
    cancelDownload.value = undefined
    try {
      const response = await HttpGet(releaseUrl, {
        Authorization: getGitHubApiAuthorization(appSettings.app),
      })
      const body = response.body as GitHubApiRelease | GitHubApiRelease[]
      if (!Array.isArray(body) && body.message) {
        throw new Error(body.message)
      }

      const release = Array.isArray(body) ? body.find((v) => v.prerelease) : body
      if (!release) {
        throw new Error('Not Found')
      }
      const { assets, tag_name } = release
      const assetName = getKernelAssetFileName(tag_name.replace('v', ''))
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

      const downloadCacheFile = `data/.cache/${assetName}`

      cancelDownload.value = () => {
        HttpCancel(downloadCacheFile)
        setTimeout(() => RemoveFile(downloadCacheFile), 1000)
        cancelDownload.value = undefined
      }

      await MakeDir(CoreWorkingDirectory)

      await Download(
        asset.browser_download_url,
        downloadCacheFile,
        undefined,
        (progress, total) => {
          const txt = `${t('common.downloading') + ((progress / total) * 100).toFixed(2)}%`
          downloadProgress.value = txt
        },
        {
          CancelId: downloadCacheFile,
          Sha256: asset.digest.slice(7),
        },
      )

      const stableFileName = getKernelFileName()

      await ignoredError(MoveFile, CoreFilePath, CoreBakFilePath)

      if (assetName.endsWith('.zip')) {
        await UnzipZIPFile(downloadCacheFile, 'data/.cache')
        const tmpPath = `data/.cache/${assetName.replace('.zip', '')}`
        await MoveFile(`${tmpPath}/${stableFileName}`, CoreFilePath)
        await RemoveFile(tmpPath)
      } else if (assetName.endsWith('.tar.gz')) {
        await UnzipTarGZFile(downloadCacheFile, 'data/.cache')
        const tmpPath = `data/.cache/${assetName.replace('.tar.gz', '')}`
        await MoveFile(`${tmpPath}/${stableFileName}`, CoreFilePath)
        await RemoveFile(tmpPath)
      }

      await RemoveFile(downloadCacheFile)

      if (!CoreFilePath.endsWith('.exe')) {
        await ignoredError(Exec, 'chmod', ['+x', await AbsolutePath(CoreFilePath)])
      }

      void refreshLocalVersion()
      downloadCompleted.value = true
      message.success('common.success')
    } catch (error) {
      console.log(error)
      message.error(error)
      downloadCompleted.value = false
    }
    downloading.value = false
  }

  const getLocalVersion = async (showTips = false) => {
    localVersionLoading.value = true
    try {
      const res = await Exec(CoreFilePath, ['version'])
      versionDetail.value = res.trim()
      return /version (\S+)/u.exec(res)?.[1] ?? ''
    } catch (error: any) {
      console.log(error)
      showTips && message.error(error)
    } finally {
      localVersionLoading.value = false
    }
    return ''
  }

  const getRemoteVersion = async (showTips = false) => {
    remoteVersionLoading.value = true
    try {
      const response = await HttpGet(releaseUrl, {
        Authorization: getGitHubApiAuthorization(appSettings.app),
      })
      const body = response.body as GitHubApiRelease | GitHubApiRelease[]
      if (!Array.isArray(body) && body.message) {
        throw new Error(body.message)
      }

      const release = Array.isArray(body) ? body.find((v) => v.prerelease) : body
      if (!release) {
        throw new Error('Not Found')
      }
      const { tag_name } = release
      return tag_name.replace('v', '')
    } catch (error: any) {
      console.log(error)
      showTips && message.error(error)
    } finally {
      remoteVersionLoading.value = false
    }
    return ''
  }

  const restartCore = async () => {
    if (!kernelApiStore.running) {
      return
    }
    try {
      await kernelApiStore.restartCore()
      downloadCompleted.value = false
    } catch (error: any) {
      message.error(error)
    }
  }

  const refreshLocalVersion = async (showTips = false) => {
    localVersion.value = await getLocalVersion(showTips)
  }

  const refreshRemoteVersion = async (showTips = false) => {
    if (envStore.env.isBundled) {
      message.info('about.updatesManagedByOS')
      return
    }
    remoteVersion.value = await getRemoteVersion(showTips)
  }

  const grantCorePermission = async () => {
    if (envStore.env.isBundled) {
      message.info('about.updatesManagedByOS')
      return
    }
    await GrantTUNPermission(CoreFilePath)
    message.success('common.success')
  }

  const rollbackCore = async () => {
    if (envStore.env.isBundled) {
      message.info('about.updatesManagedByOS')
      return
    }
    await confirm('common.warning', 'settings.kernel.rollback')

    const doRollback = () => MoveFile(CoreBakFilePath, CoreFilePath)

    const { branch } = appSettings.app.kernel
    const isCurrentRunning = kernelApiStore.running && (branch === Branch.Alpha) === isAlpha
    if (isCurrentRunning) {
      await kernelApiStore.restartCore(doRollback)
    } else {
      await doRollback()
    }
    void refreshLocalVersion()
    message.success('common.success')
  }

  const openReleasePage = () => {
    BrowserOpenURL(isAlpha ? AlphaPage : StablePage)
  }

  const openFileLocation = async () => {
    await OpenDir(CoreWorkingDirectory)
  }

  watch(
    () => appSettings.app.kernel.branch,
    () => (downloadCompleted.value = false),
  )

  watch(
    [localVersion, downloadCompleted],
    debounce(async () => {
      rollbackable.value = await FileExists(CoreBakFilePath)
    }, 500),
  )

  void refreshLocalVersion()
  if (!envStore.env.isBundled) {
    void refreshRemoteVersion()
  }

  return {
    restartable,
    updatable,
    grantable,
    rollbackable,
    versionDetail,
    localVersion,
    localVersionLoading,
    remoteVersion,
    remoteVersionLoading,
    downloading,
    downloadProgress,
    refreshLocalVersion,
    refreshRemoteVersion,
    downloadCore,
    cancelDownload,
    restartCore,
    rollbackCore,
    grantCorePermission,
    openReleasePage,
    openFileLocation,
  }
}
