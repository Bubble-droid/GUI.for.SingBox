<script lang="ts" setup>
import { createCertificateProvider } from '@defaults/certificate_provider'
import { CertificateProviderType } from '@features/constant/kernel'
import { CertificateProviderTypeOptions } from '@features/constant/options'
import type { CertificateProviderConfig } from '@profiles/certificate_provider'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { useBool } from '@/hooks'
import { deepClone, message } from '@/utils'

import type { ComponentOption } from '@/types/views'

import AcmeCert from './AcmeCert.vue'
import CloudflareOriginCa from './CloudflareOriginCa.vue'
import TailscaleCert from './TailscaleCert.vue'

interface Props {
  httpClientOptions: ComponentOption[]
  tailscaleOptions: ComponentOption[]
  dnsServerOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<CertificateProviderConfig[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<CertificateProviderConfig>(
  createCertificateProvider(CertificateProviderType.Acme),
)

const handleAdd = () => {
  editIndex = -1
  fields.value = createCertificateProvider(CertificateProviderType.Acme)
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

const onTypeChange = (newType: CertificateProviderType) => {
  const base = { id: fields.value.id, enable: fields.value.enable }
  try {
    fields.value = { ...createCertificateProvider(newType), ...base }
  } catch (error) {
    message.error(error)
  }
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
    <Card v-for="(provider, index) in model" :key="provider.id" class="mb-2">
      <div class="flex items-center py-2 gap-8">
        <Switch v-model="provider.enable" size="small" />
        <div class="flex items-center gap-2">
          <Tag color="cyan">{{ provider.tag }}</Tag>
          <Tag>{{ provider.type }}</Tag>
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
    title="kernel.certificate_providers.title"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.certificate_providers.type.title') }}
      <Select
        :model-value="fields.type"
        :options="CertificateProviderTypeOptions"
        @update:model-value="onTypeChange"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.certificate_providers.tag') }}
      <Input v-model="fields.tag" autofocus clearable />
    </div>

    <AcmeCert
      v-if="fields.type === CertificateProviderType.Acme"
      v-model="fields.config"
      :http-client-options="httpClientOptions"
      :dns-server-options="dnsServerOptions"
    />
    <TailscaleCert
      v-else-if="fields.type === CertificateProviderType.Tailscale"
      v-model="fields.config"
      :tailscale-options="tailscaleOptions"
    />
    <CloudflareOriginCa
      v-else-if="fields.type === CertificateProviderType.CloudflareOriginCa"
      v-model="fields.config"
      :http-client-options="httpClientOptions"
    />
  </Modal>
</template>
