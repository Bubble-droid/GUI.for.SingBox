<script setup lang="ts">
import AppShell from './components/_common/AppShell.vue'
import GlobalOverlays from './components/_common/GlobalOverlays.vue'
import SplashView from './components/_common/SplashView.vue'
import { useAppBootstrap } from './hooks/useAppBootstrap'
import { useAppLifecycle } from './hooks/useAppLifecycle'

const { loading, percent, hasError } = useAppBootstrap()

useAppLifecycle()
</script>

<template>
  <SplashView v-if="loading">
    <Progress
      :percent="percent"
      :status="hasError ? 'danger' : 'primary'"
      :radius="10"
      type="circle"
    />
  </SplashView>
  <AppShell v-else />
  <GlobalOverlays :loading="loading" />
</template>
