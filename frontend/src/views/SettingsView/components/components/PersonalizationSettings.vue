<script lang="ts" setup>
import { MakeDir, OpenDir } from '@/bridge/io'
import { BrowserOpenURL } from '@wails/runtime/runtime'

import { ColorOptions, DefaultFontFamily, LocalesFilePath, ThemeOptions } from '@/constant/app'
import { Color, OS } from '@/enums/app'
import { appPages } from '@/router/pages'
import { useAppStore } from '@/stores/app'
import { useAppSettingsStore } from '@/stores/appSettings'
import { APP_LOCALES_URL } from '@/utils/env'

const pages = appPages
  .filter((page) => !('hidden' in page))
  .map((page) => ({
    label: page.label,
    value: page.name,
  }))

const appStore = useAppStore()
const appSettings = useAppSettingsStore()

const resetFontFamily = () => {
  appSettings.app.fontFamily = DefaultFontFamily
}

const onThemeClick = (e: MouseEvent) => {
  document.documentElement.style.setProperty('--x', e.clientX + 'px')
  document.documentElement.style.setProperty('--y', e.clientY + 'px')
}

const handleOpenLocalesFolder = async () => {
  await MakeDir(LocalesFilePath)
  await OpenDir(LocalesFilePath)
}
</script>
<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.personalization') }}</div>

  <Card>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.theme.name') }}</div>
      <Radio v-model="appSettings.app.theme" :options="ThemeOptions" @click="onThemeClick" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.color.name') }}</div>
      <div class="flex items-center">
        <div v-if="appSettings.app.color === Color.Custom" class="flex items-center mr-4">
          <ColorPicker v-model="appSettings.app.primaryColor">
            <template #suffix>
              <div class="text-12">{{ $t('settings.color.primary') }}</div>
            </template>
          </ColorPicker>
          <ColorPicker v-model="appSettings.app.secondaryColor">
            <template #suffix>
              <div class="text-12">{{ $t('settings.color.secondary') }}</div>
            </template>
          </ColorPicker>
        </div>
        <Radio v-model="appSettings.app.color" :options="ColorOptions" />
      </div>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="flex items-center text-16 font-bold">
        <div class="mr-4">{{ $t('settings.lang.name') }}</div>
        <Button type="text" icon="link" @click="BrowserOpenURL(APP_LOCALES_URL)" />
        <Button type="text" icon="folder" @click="handleOpenLocalesFolder" />
        <Button
          v-tips="'settings.lang.load'"
          :loading="appStore.localesLoading"
          type="text"
          icon="refresh"
          @click="appStore.loadLocales()"
        />
      </div>
      <Radio v-model="appSettings.app.lang as string" :options="appStore.locales" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.fontFamily') }}</div>
      <Input v-model="appSettings.app.fontFamily" editable class="text-14">
        <template #suffix>
          <Button
            v-tips="'settings.resetFont'"
            type="text"
            size="small"
            icon="reset"
            @click="resetFontFamily"
          />
        </template>
      </Input>
    </div>
    <div v-platform="[OS.Linux, OS.Windows]" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.systemTitleBar') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="appSettings.app.systemTitleBar" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.pages.name') }}</div>
      <CheckBox v-model="appSettings.app.pages" :options="pages" />
    </div>
  </Card>
</template>
