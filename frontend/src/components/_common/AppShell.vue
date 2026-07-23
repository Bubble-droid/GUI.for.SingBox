<script setup lang="ts">
import { useRoute } from 'vue-router'

import { useAppSettingsStore } from '@/stores'

import { NavigationBar, TitleBar } from '@/components'

const route = useRoute()
const appSettings = useAppSettingsStore()
</script>

<template>
  <TitleBar v-if="!appSettings.app.systemTitleBar" />
  <div class="app-content flex-1 overflow-y-auto flex flex-col p-8">
    <NavigationBar />
    <div
      :class="{ 'app-page--overview': route.name === 'Overview' }"
      class="app-page flex flex-col overflow-y-auto mt-8 px-8 h-full"
    >
      <RouterView #="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
  </div>
</template>
