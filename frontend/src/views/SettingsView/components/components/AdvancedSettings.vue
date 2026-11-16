<script lang="ts" setup>
import { onMounted, ref } from 'vue'

import { MakeDir, OpenDir, OpenURI, ReadFile, WriteFile } from '@/bridge'
import {
  CacheDirectory,
  ConfigDirectory,
  DataDirectory,
  RollingReleaseDirectory,
} from '@/constant/app'
import { OS } from '@/enums/app'
import { useAppSettingsStore, useEnvStore } from '@/stores'
import { APP_TITLE, message } from '@/utils'

const appSettings = useAppSettingsStore()
const envStore = useEnvStore()

// The flags file is a fixed per-user anchor. It stays put even when the data
// directory moves, so it can point at a custom location on the next launch.
const defaultFlagsContent = `# ${APP_TITLE} persistent launch flags
# One flag per line; lines starting with # are ignored.
# Command-line flags override these values for a single run.
#
# --data-dir=~/${APP_TITLE}-data
# --portable
# --window-start-state=minimised
`

const flagsContent = ref(defaultFlagsContent)

const handleOpenFolder = async () => {
  await MakeDir(DataDirectory)
  await OpenDir(DataDirectory)
}

const handleOpenConfigFolder = async () => {
  await MakeDir(ConfigDirectory)
  await OpenDir(ConfigDirectory)
}

const handleOpenCacheFolder = async () => {
  await MakeDir(CacheDirectory)
  await OpenDir(CacheDirectory)
}

const handleOpenRollingReleaseFolder = async () => {
  await MakeDir(RollingReleaseDirectory)
  await OpenDir(RollingReleaseDirectory)
}

const loadFlags = async () => {
  try {
    flagsContent.value = await ReadFile(envStore.env.flagsFilePath)
  } catch {
    flagsContent.value = defaultFlagsContent
  }
}

const saveFlags = async () => {
  try {
    await WriteFile(envStore.env.flagsFilePath, flagsContent.value)
    message.success('common.success')
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const openFlagsFile = async () => {
  try {
    await WriteFile(envStore.env.flagsFilePath, flagsContent.value)
    await OpenURI(envStore.env.flagsFilePath)
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

onMounted(loadFlags)
</script>

<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.advanced') }}</div>

  <Card>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.appFolder.name') }}</div>
      <Button type="primary" icon="folder" @click="handleOpenFolder">
        <span class="ml-8">{{ $t('settings.appFolder.open') }}</span>
      </Button>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.appFolder.config') }}</div>
      <Button type="primary" icon="folder" @click="handleOpenConfigFolder">
        <span class="ml-8">{{ $t('settings.appFolder.openConfig') }}</span>
      </Button>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.appFolder.cache') }}</div>
      <Button type="primary" icon="folder" @click="handleOpenCacheFolder">
        <span class="ml-8">{{ $t('settings.appFolder.openCache') }}</span>
      </Button>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.rollingRelease') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <div class="flex items-center gap-4">
        <Button type="primary" icon="folder" size="small" @click="handleOpenRollingReleaseFolder" />
        <Switch v-model="appSettings.app.rollingRelease" disabled />
      </div>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.updateIncludePrerelease') }}</div>
      <Switch v-model="appSettings.app.updateIncludePrerelease" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.realMemoryUsage') }}</div>
      <Switch v-model="appSettings.app.kernel.realMemoryUsage" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.autoRestartKernel.name') }}
        <span class="font-normal text-12">({{ $t('settings.autoRestartKernel.tips') }})</span>
      </div>
      <Switch v-model="appSettings.app.autoRestartKernel" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.multipleInstance') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="appSettings.app.multipleInstance" />
    </div>
    <div v-platform="[OS.Windows, OS.Darwin]" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.contentProtection') }}
        <span class="font-normal text-12">({{ $t('settings.contentProtectionTips') }})</span>
      </div>
      <Switch v-model="appSettings.app.contentProtection" />
    </div>
  </Card>

  <Card>
    <div class="px-8 py-12 flex flex-col gap-12">
      <div class="flex items-center justify-between gap-16">
        <div class="text-16 font-bold">
          {{ $t('settings.launchFlags.name') }}
          <span class="font-normal text-12">({{ $t('settings.launchFlags.persistent') }})</span>
        </div>
        <div class="flex items-center gap-4">
          <Button
            v-tips="'settings.launchFlags.reload'"
            type="text"
            icon="refresh"
            @click="loadFlags"
          />
          <Button
            v-tips="'settings.launchFlags.open'"
            type="text"
            icon="folder"
            @click="openFlagsFile"
          />
          <Button type="primary" @click="saveFlags">{{ $t('common.save') }}</Button>
        </div>
      </div>
      <div class="text-12 opacity-70 leading-relaxed">{{ $t('settings.launchFlags.tips') }}</div>
      <div class="text-12 opacity-50 break-all">{{ envStore.env.flagsFilePath }}</div>
      <CodeEditor v-model="flagsContent" lang="yaml" editable class="min-w-256" />
    </div>
  </Card>
</template>
