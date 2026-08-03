<script lang="ts" setup>
import { createEndpoint } from '@defaults/endpoints'
import { Endpoint } from '@features/constant/kernel'
import { EndpointOptions } from '@features/constant/options'
import type { ComponentOption } from '@features/types/views'
import type { EndpointConfig } from '@profiles/endpoints'
import DialerConfig from '@views/Shared/DialerConfig.vue'
import UdpNatConfig from '@views/Shared/UdpNatConfig.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { useBool } from '@/hooks'
import { deepClone, message } from '@/utils'

import WireGuard from './WireGuard.vue'

interface Props {
  inboundOptions: ComponentOption[]
  outboundOptions: ComponentOption[]
  dnsServerOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<EndpointConfig[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<EndpointConfig>(createEndpoint(Endpoint.WireGuard))

const handleAdd = () => {
  editIndex = -1
  fields.value = createEndpoint(Endpoint.WireGuard)
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

const onTypeChange = (newType: Endpoint) => {
  const base = { id: fields.value.id, enable: fields.value.enable }
  try {
    fields.value = { ...createEndpoint(newType), ...base }
  } catch (error) {
    message.error(error)
  }
}
</script>

<template>
  <Empty v-if="model.length === 0">
    <template #description>
      <Button icon="add" type="primary" size="small" @click="handleAdd">{{
        t('common.add')
      }}</Button>
    </template>
  </Empty>

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(endpoint, index) in model" :key="endpoint.id" class="mb-2">
      <div class="flex items-center py-2 gap-8">
        <Switch v-model="endpoint.enable" size="small" />
        <div class="flex items-center">
          <Tag color="cyan">{{ endpoint.tag }}</Tag>
          <Tag>{{ endpoint.type }}</Tag>
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
    title="kernel.endpoints.title"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.endpoints.type.title') }}
      <Select
        :model-value="fields.type"
        :options="EndpointOptions"
        @update:model-value="onTypeChange"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.endpoints.tag') }}
      <Input v-model="fields.tag" autofocus clearable />
    </div>
    <template v-if="fields.type === Endpoint.WireGuard">
      <WireGuard
        :model-value="fields.config"
        :outbound-options="outboundOptions"
        :dns-server-options="dnsServerOptions"
      />
    </template>
    <template v-if="'dialer' in fields.config">
      <DialerConfig
        v-model="fields.config.dialer"
        :outbound-options="outboundOptions"
        :server-options="dnsServerOptions"
      />
    </template>
    <template v-if="'udpNat' in fields.config">
      <UdpNatConfig v-model="fields.config.udpNat" />
    </template>
  </Modal>
</template>
