<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getDefaultInbound, DraggableOptions } from '@/constant'
import {
  InboundOptions,
  NetworkOptions,
  TunDnsModeOptions,
  TunStackOptions,
} from '@/constant/kernel'
import { Inbound, Network } from '@/enums'
import { useBool } from '@/hooks'
import { deepClone } from '@/utils'

import type { InboundAuthProfile, InboundNetworkProfile, InboundProfile } from '@/types'

import ListenConfig from './Shared/ListenConfig.vue'
import RawFieldsConfig from './Shared/RawFieldsConfig.vue'

interface Props {
  ruleSetOptions: { label: string; value: string }[]
  inboundOptions: { label: string; value: string }[]
}

defineProps<Props>()
const model = defineModel<InboundProfile[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<InboundProfile>(getDefaultInbound(Inbound.Mixed))

const isUserAuthSupported = (inbound: InboundProfile): inbound is InboundAuthProfile => {
  return [Inbound.Mixed, Inbound.Socks, Inbound.Http].includes(inbound.type as any)
}

const isNetworkListeningSupported = (inbound: InboundProfile): inbound is InboundNetworkProfile => {
  return [Inbound.Direct, Inbound.Tproxy].includes(inbound.type as any)
}
const handleAdd = () => {
  editIndex = -1
  fields.value = getDefaultInbound(Inbound.Mixed)
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleEdit = (index: number) => {
  editIndex = index
  fields.value = deepClone(model.value[index]!)
  showEditModal.value = true
}

const handleDelete = (index: number) => {
  model.value.splice(index, 1)
}

const handleAddEnd = () => {
  if (editIndex !== -1) {
    model.value[editIndex] = fields.value
  } else {
    model.value.unshift(fields.value)
  }
}

const onTypeChange = (newType: Inbound) => {
  const base = { id: fields.value.id, enable: fields.value.enable }
  fields.value = { ...getDefaultInbound(newType), ...base } as InboundProfile
}
</script>

<template>
  <Empty v-if="model.length === 0">
    <template #description>
      <Button icon="add" type="primary" size="small" @click="handleAdd">
        {{ t('common.add') }}
      </Button>
    </template>
  </Empty>

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(inbound, index) in model" :key="inbound.id" class="mb-2">
      <div class="flex items-center py-2 gap-8">
        <Switch v-model="inbound.enable" size="small" />
        <div class="flex items-center">
          <Tag>{{ inbound.type }}</Tag>
          <Tag color="cyan">{{ inbound.tag }}</Tag>
        </div>
        <div class="ml-auto">
          <Button icon="edit" type="text" size="small" @click="handleEdit(index)" />
          <Button icon="delete" type="text" size="small" @click="handleDelete(index)" />
        </div>
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    :on-ok="handleAddEnd"
    title="kernel.inbounds.title"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.inbounds.type.title') }}
      <Select
        :model-value="fields.type"
        :options="InboundOptions"
        @update:model-value="onTypeChange"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.inbounds.tag') }}
      <Input v-model="fields.tag" autofocus />
    </div>

    <template v-if="fields.type === Inbound.Tun">
      <div class="form-item">
        {{ t('kernel.inbounds.tun.interface_name') }}
        <Input v-model="fields.config.interface_name" editable clearable />
      </div>
      <div :class="{ 'items-start': fields.config.address.length }" class="form-item">
        {{ t('kernel.inbounds.tun.address') }}
        <InputList v-model="fields.config.address" />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.mtu') }}
        <Input v-model="fields.config.mtu" type="number" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.dns_mode.title') }}
        <Select v-model="fields.config.dns_mode" :options="TunDnsModeOptions" />
      </div>
      <div :class="{ 'items-start': fields.config.dns_address.length }" class="form-item">
        {{ t('kernel.inbounds.tun.dns_address') }}
        <InputList v-model="fields.config.dns_address" placeholder="172.18.0.2 fdfe:dcba:9876::2" />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.auto_route') }}
        <Switch v-model="fields.config.auto_route" />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.auto_redirect') }}
        <Switch v-model="fields.config.auto_redirect" />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.strict_route') }}
        <Switch v-model="fields.config.strict_route" />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.endpoint_independent_nat') }}
        <Switch v-model="fields.config.endpoint_independent_nat" />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.stack.title') }}
        <Select v-model="fields.config.stack" :options="TunStackOptions" />
      </div>
      <div :class="{ 'items-start': fields.config.route_address.length }" class="form-item">
        {{ t('kernel.inbounds.tun.route_address') }}
        <InputList v-model="fields.config.route_address" placeholder="0.0.0.0/1 ::1" />
      </div>
      <div :class="{ 'items-start': fields.config.route_exclude_address.length }" class="form-item">
        {{ t('kernel.inbounds.tun.route_exclude_address') }}
        <InputList
          v-model="fields.config.route_exclude_address"
          placeholder="192.168.0.0/16 fc00::/7"
        />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.route_address_set') }}
        <MultipleSelect
          v-model="fields.config.route_address_set"
          :options="ruleSetOptions"
          clearable
          auto-size
        />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tun.route_exclude_address_set') }}
        <MultipleSelect
          v-model="fields.config.route_exclude_address_set"
          :options="ruleSetOptions"
          clearable
          auto-size
        />
      </div>
      <div :class="{ 'items-start': fields.config.include_interface.length }" class="form-item">
        {{ t('kernel.inbounds.tun.include_interface') }}
        <InterfaceSelect v-model="fields.config.include_interface" multiple clearable auto-size />
      </div>
      <div
        v-if="fields.config.auto_route"
        :class="{ 'items-start': fields.config.exclude_interface.length }"
        class="form-item"
      >
        {{ t('kernel.inbounds.tun.exclude_interface') }}
        <InterfaceSelect v-model="fields.config.exclude_interface" multiple clearable auto-size />
      </div>
    </template>

    <template v-else>
      <div v-if="isUserAuthSupported(fields)" class="form-item items-start">
        {{ t('kernel.inbounds.users') }}
        <KeyValueEditor
          v-model="fields.config.users"
          :placeholder="['username', 'password']"
          style="min-width: 320px"
        />
      </div>
      <div v-if="isNetworkListeningSupported(fields)" class="form-item">
        {{ t('kernel.inbounds.network.title') }}
        <Select
          v-model="fields.config.network"
          :placeholder="t('kernel.inbounds.network.default')"
          :options="NetworkOptions.filter((v) => v.value !== Network.Icmp)"
          clearable
        />
      </div>
      <ListenConfig v-model="fields.config.listen" :inbound-options="inboundOptions" />
    </template>
    <RawFieldsConfig v-model="fields.fields" />
  </Modal>
</template>
