<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions, getDefaultService, ServiceOptions } from '@/constant'
import { Service } from '@/enums'
import { useBool } from '@/hooks'
import { deepClone } from '@/utils'

import type { ComponentOption, ServiceProfile } from '@/types'

import DialerConfig from '../Shared/DialerConfig.vue'
import ListenConfig from '../Shared/ListenConfig.vue'
import RawFieldsConfig from '../Shared/RawFieldsConfig.vue'
import ApiService from './components/ApiService.vue'

interface Props {
  httpClientOptions: ComponentOption[]
  inboundOptions: ComponentOption[]
  outboundOptions: ComponentOption[]
  serverOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<ServiceProfile[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<ServiceProfile>(getDefaultService(Service.Api))

const handleAdd = () => {
  editIndex = -1
  fields.value = getDefaultService(Service.Api)
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

const onTypeChange = (newType: Service) => {
  const base = { id: fields.value.id, enable: fields.value.enable }
  fields.value = { ...getDefaultService(newType), ...base } as ServiceProfile
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
    <Card v-for="(service, index) in model" :key="service.id" class="mb-2">
      <div class="flex items-center py-2 gap-8">
        <Switch v-model="service.enable" size="small" />
        <div class="flex items-center">
          <Tag>{{ service.type }}</Tag>
          <Tag color="cyan">{{ service.tag }}</Tag>
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
    title="kernel.services.title"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.services.type.title') }}
      <Select
        :model-value="fields.type"
        :options="ServiceOptions"
        @update:model-value="onTypeChange"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.services.tag') }}
      <Input v-model="fields.tag" autofocus />
    </div>
    <template v-if="fields.type === Service.Api">
      <ApiService v-model="fields.config" :http-client-options="httpClientOptions" />
    </template>
    <template v-if="fields.type === Service.UsbipClient">
      <DialerConfig
        v-model="fields.config.dialer"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
      />
    </template>
    <template v-else>
      <ListenConfig v-model="fields.config.listen" :inbound-options="inboundOptions" />
    </template>
    <RawFieldsConfig v-model="fields.fields" />
  </Modal>
</template>
