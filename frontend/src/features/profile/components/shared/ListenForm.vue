<script lang="ts" setup>
import type { ListenFormData } from '@profile/types/profiles/shared.ts'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks/useBool'

import type { OptionItem } from '@/types/component'

import PortInput from './PortInput.vue'

interface Props {
  netnsOptions: OptionItem[]
  inboundOptions: OptionItem[]
}

const model = defineModel<ListenFormData>({ required: true })
defineProps<Props>()
const { t } = useI18n()

const [showListen, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">{{
      t('kernel.shared.listen.title')
    }}</Button>
  </Divider>
  <div v-show="showListen">
    <div class="form-item">
      {{ t('kernel.shared.listen.listen') }}
      <Input v-model="model.listen" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.listen_port') }}
      <PortInput v-model="model.listen_port" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.bind_interface') }}
      <Input v-model="model.bind_interface" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.routing_mark') }}
      <Input v-model="model.routing_mark" type="number" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.reuse_addr') }}
      <Switch v-model="model.reuse_addr" />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.netns') }}
      <Select v-model="model.netns" :options="netnsOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.tcp_fast_open') }}
      <Switch v-model="model.tcp_fast_open" />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.tcp_multi_path') }}
      <Switch v-model="model.tcp_multi_path" />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.disable_tcp_keep_alive') }}
      <Switch v-model="model.disable_tcp_keep_alive" />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.tcp_keep_alive') }}
      <Input v-model="model.tcp_keep_alive" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.tcp_keep_alive_interval') }}
      <Input v-model="model.tcp_keep_alive_interval" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.udp_fragment') }}
      <Switch v-model="model.udp_fragment" />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.udp_timeout') }}
      <Input v-model="model.udp_timeout" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.listen.detour') }}
      <Select v-model="model.detour" :options="inboundOptions" clearable />
    </div>
  </div>
</template>
