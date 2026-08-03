<script lang="ts" setup>
import { UdpNatBehaviorOptions } from '@features/constant/options'
import type { UdpNat } from '@profiles/shared'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks'

const model = defineModel<UdpNat>({ required: true })
const { t } = useI18n()

const [show, toggle] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggle">{{ t('kernel.shared.udp_nat.title') }}</Button>
  </Divider>
  <div v-show="show">
    <div class="form-item">
      {{ t('kernel.shared.udp_nat.udp_timeout') }}
      <Input v-model="model.udp_timeout" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.udp_nat.udp_mapping') }}
      <Select v-model="model.udp_mapping" :options="UdpNatBehaviorOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.udp_nat.udp_filtering') }}
      <Select v-model="model.udp_filtering" :options="UdpNatBehaviorOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.udp_nat.udp_nat_max') }}
      <Input v-model="model.udp_nat_max" type="number" editable clearable />
    </div>
  </div>
</template>
