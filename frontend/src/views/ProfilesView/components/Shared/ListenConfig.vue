<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks'

import type { Listen } from '@/types'

interface Props {
  inboundOptions: { label: string; value: string }[]
}

defineProps<Props>()
const model = defineModel<Listen>({ required: true })
const { t } = useI18n()

const [showListen, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">{{ t('kernel.listen.title') }}</Button>
  </Divider>
  <div v-show="showListen">
    <div class="form-item">
      {{ t('kernel.listen.listen') }}
      <Input v-model="model.listen" />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.listen_port') }}
      <Input v-model="model.listen_port" type="number" :min="0" :max="65535" />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.bind_interface') }}
      <Input v-model="model.bind_interface" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.routing_mark') }}
      <Input v-model="model.routing_mark" type="number" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.reuse_addr') }}
      <Switch v-model="model.reuse_addr" />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.netns') }}
      <Input v-model="model.netns" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.tcp_fast_open') }}
      <Switch v-model="model.tcp_fast_open" />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.tcp_multi_path') }}
      <Switch v-model="model.tcp_multi_path" />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.disable_tcp_keep_alive') }}
      <Switch v-model="model.disable_tcp_keep_alive" />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.tcp_keep_alive') }}
      <Input v-model="model.tcp_keep_alive" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.tcp_keep_alive_interval') }}
      <Input v-model="model.tcp_keep_alive_interval" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.udp_fragment') }}
      <Switch v-model="model.udp_fragment" />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.udp_timeout') }}
      <Input v-model="model.udp_timeout" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.listen.detour') }}
      <Select v-model="model.detour" :options="inboundOptions" clearable />
    </div>
  </div>
</template>
