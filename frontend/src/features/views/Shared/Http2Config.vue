<script lang="ts" setup>
import type { Http2Options } from '@profiles/shared'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks/useBool'

const model = defineModel<Http2Options>({ required: true })
const { t } = useI18n()

const [showHttp2, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">
      {{ t('kernel.shared.http2.title') }}
    </Button>
  </Divider>
  <div v-show="showHttp2">
    <div class="form-item">
      {{ t('kernel.shared.http2.idle_timeout') }}
      <Input v-model="model.idle_timeout" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.http2.keep_alive_period') }}
      <Input v-model="model.keep_alive_period" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.http2.stream_receive_window') }}
      <Input v-model="model.stream_receive_window" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.http2.connection_receive_window') }}
      <Input v-model="model.connection_receive_window" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.http2.max_concurrent_streams') }}
      <Input v-model="model.max_concurrent_streams" type="number" editable clearable />
    </div>
  </div>
</template>
