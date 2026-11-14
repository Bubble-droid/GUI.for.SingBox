<script lang="ts" setup>
import { MakeDir, OpenDir } from '@/bridge'
import {
  CacheDirectory,
  ConfigDirectory,
  DataDirectory,
  RollingReleaseDirectory,
} from '@/constant/app'
import { OS } from '@/enums/app'
import { useAppSettingsStore } from '@/stores'

const appSettings = useAppSettingsStore()

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
</template>
