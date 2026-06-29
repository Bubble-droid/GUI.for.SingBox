<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { getDefaultHttpClient } from '@/constant/profile'
import { useBool } from '@/hooks'
import { deepClone } from '@/utils'

import type { HttpClientProfile } from '@/types'

import DialerConfig from './Shared/DialerConfig.vue'
import RawFieldsConfig from './Shared/RawFieldsConfig.vue'

interface Props {
  outboundOptions: { label: string; value: string }[]
  serverOptions: { label: string; value: string }[]
}

defineProps<Props>()
const model = defineModel<HttpClientProfile[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<HttpClientProfile>(getDefaultHttpClient())

const handleAdd = () => {
  editIndex = -1
  fields.value = getDefaultHttpClient()
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
    <Card v-for="(client, index) in model" :key="client.id" class="mb-2">
      <div class="flex items-center py-2 gap-8">
        <Switch v-model="client.enable" size="small" />
        <div class="flex items-center">
          <Tag color="cyan">{{ client.tag }}</Tag>
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
    title="kernel.http_clients.title"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.http_clients.tag') }}
      <Input v-model="fields.tag" autofocus />
    </div>
    <DialerConfig
      v-model="fields.config.dialer"
      :outbound-options="outboundOptions"
      :server-options="serverOptions"
    />
    <RawFieldsConfig v-model="fields.fields" />
  </Modal>
</template>
