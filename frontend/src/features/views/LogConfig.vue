<script lang="ts" setup>
import { LogLevelOptions } from '@features/constant/options'
import type { LogConfig } from '@profiles/log'
import { useI18n } from 'vue-i18n'

const model = defineModel<LogConfig>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div>
    <div class="form-item">
      {{ t('kernel.log.disabled') }}
      <Switch v-model="model.disabled" />
    </div>

    <div class="form-item">
      {{ t('kernel.log.level.title') }}
      <Select v-model="model.level" :options="LogLevelOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.log.output') }}
      <Input v-model="model.output" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.log.timestamp') }}
      <Switch v-model="model.timestamp" />
    </div>
  </div>
</template>
