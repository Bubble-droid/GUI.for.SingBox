<script lang="ts" setup>
import { PredefinedNtpServerOptions } from '@features/constant/options'
import type { ComponentOption } from '@features/types/views'
import type { NtpConfig } from '@profiles/ntp'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DialerConfig from './Shared/DialerConfig.vue'

interface Props {
  netnsOptions: ComponentOption[]
  outboundOptions: ComponentOption[]
  dnsServerOptions: ComponentOption[]
}

defineProps<Props>()

const model = defineModel<NtpConfig>({ required: true })

const { t } = useI18n()

const serverSelect = computed({
  get() {
    const isPredefined = PredefinedNtpServerOptions.some(
      (opt) => opt.value === model.value.server && opt.value !== 'custom',
    )
    return isPredefined ? model.value.server : 'custom'
  },
  set(val) {
    if (val === 'custom') {
      model.value.server = ''
    } else {
      model.value.server = val
    }
  },
})

const isCustomServer = computed(() => serverSelect.value === 'custom')
</script>

<template>
  <div>
    <div class="form-item">
      {{ t('kernel.ntp.enabled') }}
      <Switch v-model="model.enabled" />
    </div>

    <div class="form-item">
      {{ t('kernel.ntp.server.title') }}
      <Select v-model="serverSelect" :options="PredefinedNtpServerOptions" />
    </div>
    <template v-if="isCustomServer">
      <div class="form-item">
        {{ t('kernel.ntp.server.custom') }}
        <Input v-model.lazy="model.server" clearable />
      </div>
    </template>
    <div class="form-item">
      {{ t('kernel.ntp.server_port') }}
      <Input v-model="model.server_port" type="number" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.ntp.interval') }}
      <Input v-model="model.interval" editable clearable />
    </div>
    <DialerConfig
      v-model="model.dialer"
      :netns-options="netnsOptions"
      :outbound-options="outboundOptions"
      :dns-server-options="dnsServerOptions"
    />
  </div>
</template>
