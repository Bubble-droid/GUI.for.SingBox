<script lang="ts" setup>
import type { NetnsDefault } from '@profiles/netns'
import { useI18n } from 'vue-i18n'

const model = defineModel<NetnsDefault['config']>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.netns.default.path') }}
    <Input v-model="model.path" clearable />
  </div>
</template>
