<script setup lang="ts">
import { isDaemonCoreMode } from '@daemon/mode'
import { readDaemonVersion } from '@daemon/version'
import { h, onMounted, ref, resolveComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import logo from '@/assets/logo'
import { BrowserOpenURL, ExitApp } from '@/bridge'
import { useAppStore, useEnvStore } from '@/stores'
import { APP_TITLE, APP_VERSION, PROJECT_URL, TG_GROUP, TG_CHANNEL, ignoredError } from '@/utils'

const { t } = useI18n()
const envStore = useEnvStore()
const appStore = useAppStore()

const daemonVersion = ref('')

onMounted(async () => {
  if (!isDaemonCoreMode()) return
  daemonVersion.value = (await ignoredError(readDaemonVersion)) || ''
})

if (envStore.env.isBinaryDirWritable) {
  if (Date.now() - appStore.lastCheckTime > 60_000) {
    appStore.checkForUpdates()
  }
}

defineExpose({
  modalSlots: {
    toolbar: () => [
      h(
        resolveComponent('Button'),
        {
          type: 'link',
          icon: 'github',
          size: 'small',
          onClick: () => BrowserOpenURL(PROJECT_URL),
        },
        () => 'GitHub',
      ),
      h(
        resolveComponent('Button'),
        {
          type: 'link',
          icon: 'telegram',
          size: 'small',
          onClick: () => BrowserOpenURL(TG_GROUP),
        },
        () => 'TG Group',
      ),
      h(
        resolveComponent('Button'),
        {
          type: 'link',
          icon: 'telegram',
          size: 'small',
          onClick: () => BrowserOpenURL(TG_CHANNEL),
        },
        () => 'TG Channel',
      ),
    ],
  },
})
</script>

<template>
  <div class="flex flex-col items-center py-12">
    <img :src="logo" class="w-64" draggable="false" />
    <div class="py-8 font-bold">{{ APP_TITLE }}</div>
    <div class="flex items-center">
      <Button v-if="appStore.restartable" size="small" type="primary" @click="ExitApp">
        {{ t('titlebar.exitApp') }}
      </Button>
      <template v-else>
        <Button
          :loading="appStore.checkForUpdatesLoading"
          type="text"
          size="small"
          @click="appStore.checkForUpdates(true)"
        >
          Bridge: {{ envStore.env.appVersion }} - UI: {{ APP_VERSION }}
        </Button>
        <Button
          v-if="appStore.updatable"
          :loading="appStore.downloading"
          size="small"
          @click="appStore.downloadApp"
        >
          {{ t('about.new') }}: {{ appStore.remoteVersion }}
        </Button>
      </template>
    </div>
    <div v-if="daemonVersion" class="pt-4 text-12" style="opacity: 0.7">
      {{ t('about.daemonVersion') }}: {{ daemonVersion }}
    </div>
  </div>
</template>
