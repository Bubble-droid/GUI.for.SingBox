<script lang="ts" setup>
import DialerForm from '@profile/components/shared/DialerForm.vue'
import { PredefinedNtpServerOptions } from '@profile/constant/options.ts'
import type { NtpSection } from '@profile/types/profiles/index.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { OptionItem } from '@/types/component.ts'

interface Props {
  netnsOptions: OptionItem[]
  outboundOptions: OptionItem[]
  dnsServerOptions: OptionItem[]
}

const model = defineModel<NtpSection>({ required: true })

defineProps<Props>()

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
    <DialerForm
      v-model="model.dialer"
      :netns-options="netnsOptions"
      :outbound-options="outboundOptions"
      :dns-server-options="dnsServerOptions"
    />
  </div>
</template>
