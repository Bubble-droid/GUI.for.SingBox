<script lang="ts" setup>
import type { QuicOptions } from '@profiles/shared'
import Http2Config from '@views/Shared/Http2Config.vue'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks'

const model = defineModel<QuicOptions>({ required: true })
const { t } = useI18n()

const [showQuic, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">
      {{ t('kernel.shared.quic.title') }}
    </Button>
  </Divider>
  <div v-show="showQuic">
    <div class="form-item">
      {{ t('kernel.shared.quic.initial_packet_size') }}
      <Input v-model="model.initial_packet_size" type="number" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.quic.disable_path_mtu_discovery') }}
      <Switch v-model="model.disable_path_mtu_discovery" />
    </div>
    <Http2Config v-model="model" />
  </div>
</template>
