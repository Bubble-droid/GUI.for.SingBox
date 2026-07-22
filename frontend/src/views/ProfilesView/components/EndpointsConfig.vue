<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { EndpointOptions } from '@/constant/kernel'
import { getDefaultEndpoint } from '@/constant/profile'
import { Endpoint } from '@/enums/kernel'
import { useBool } from '@/hooks'
import { deepClone } from '@/utils'

import type { ComponentOption, EndpointProfile } from '@/types'

import DialerConfig from './Shared/DialerConfig.vue'
import ListenConfig from './Shared/ListenConfig.vue'
import RawFieldsConfig from './Shared/RawFieldsConfig.vue'

interface Props {
  inboundOptions: ComponentOption[]
  outboundOptions: ComponentOption[]
  serverOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<EndpointProfile[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<EndpointProfile>(getDefaultEndpoint(Endpoint.Wireguard))

const handleAdd = () => {
  editIndex = -1
  fields.value = getDefaultEndpoint(Endpoint.Wireguard)
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
  fields.value = { ...getDefaultEndpoint(newType), ...base }
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
          <Tag>{{ endpoint.type }}</Tag>
          <Tag color="cyan">{{ endpoint.tag }}</Tag>
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
      <Input v-model="fields.tag" autofocus />
    </div>
    <template v-if="fields.type === Endpoint.OpenvpnServer">
      <ListenConfig v-model="fields.config.listen" :inbound-options="inboundOptions" />
    </template>
    <template v-else>
      <DialerConfig
        v-model="fields.config.dialer"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
      />
    </template>
    <RawFieldsConfig v-model="fields.fields" />
  </Modal>
</template>
