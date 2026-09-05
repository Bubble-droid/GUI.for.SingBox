<script lang="ts" setup>
import { NetnsType } from '@profile/constant/kernel.ts'
import { NetnsTypeOptions } from '@profile/constant/options.ts'
import { createNetns } from '@profile/defaults/netns.ts'
import type { NetnsItem } from '@profile/types/profiles/netns.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { useBool } from '@/hooks/useBool.ts'
import { deepClone } from '@/utils/others.ts'

import DefaultForm from './components/DefaultForm.vue'
import UnshareForm from './components/UnshareForm.vue'

const model = defineModel<NetnsItem[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<NetnsItem>(createNetns(NetnsType.Default))

const handleAdd = () => {
  editIndex = -1
  fields.value = createNetns(NetnsType.Default)
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
  if (editIndex === -1) {
    model.value.unshift(fields.value)
  } else {
    model.value[editIndex] = fields.value
  }
}

const onTypeChange = (newType: NetnsType) => {
  const base = { id: fields.value.id, enable: fields.value.enable }
  fields.value = { ...createNetns(newType), ...base }
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
    <Card v-for="(netns, index) in model" :key="netns.id" class="mb-2">
      <div class="flex items-center py-2 gap-8">
        <Switch v-model="netns.enable" size="small" />
        <div class="flex items-center">
          <Tag color="cyan">{{ netns.tag }}</Tag>
          <Tag>{{ netns.type }}</Tag>
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
    title="kernel.netns.title"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.netns.type.title') }}
      <Select
        :model-value="fields.type"
        :options="NetnsTypeOptions"
        @update:model-value="onTypeChange"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.netns.tag') }}
      <Input v-model="fields.tag" autofocus clearable />
    </div>

    <DefaultForm v-if="fields.type === NetnsType.Default" :model-value="fields.config" />
    <UnshareForm v-else-if="fields.type === NetnsType.Unshare" :model-value="fields.config" />
  </Modal>
</template>
