<script lang="ts" setup>
import type { NetnsUnshare } from '@profiles/netns'
import { useI18n } from 'vue-i18n'

const model = defineModel<NetnsUnshare['config']>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.netns.unshare.pid_file') }}
    <Input v-model="model.pid_file" editable clearable />
  </div>
</template>
