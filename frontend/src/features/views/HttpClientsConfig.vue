<script lang="ts" setup>
import { createHttpClient } from '@defaults/http_client'
import { HttpEngineOptions, HttpVersionOptions } from '@features/constant/options'
import type { HttpClientConfig } from '@profiles/http_client'
import DialerConfig from '@views/Shared/DialerConfig.vue'
import Http2Config from '@views/Shared/Http2Config.vue'
import OutboundTlsConfig from '@views/Shared/OutboundTlsConfig.vue'
import QuicConfig from '@views/Shared/QuicConfig.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { useBool } from '@/hooks'
import { deepClone } from '@/utils'

import type { ComponentOption } from '@/types/views'

interface Props {
  netnsOptions: ComponentOption[]
  outboundOptions: ComponentOption[]
  dnsServerOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<HttpClientConfig[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<HttpClientConfig>(createHttpClient())

const handleAdd = () => {
  editIndex = -1
  fields.value = createHttpClient()
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
        <div class="flex items-center gap-2">
          <Tag color="cyan">{{ client.tag }}</Tag>
          <Tag v-if="client.config.version">HTTP/{{ client.config.version }}</Tag>
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
      <Input v-model="fields.tag" autofocus clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.http_clients.engine.title') }}
      <Select v-model="fields.config.engine" :options="HttpEngineOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.http_clients.version.title') }}
      <Radio v-model="fields.config.version" :options="HttpVersionOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.http_clients.disable_version_fallback') }}
      <Switch v-model="fields.config.disable_version_fallback" />
    </div>
    <div class="form-item items-start">
      {{ t('kernel.http_clients.headers') }}
      <KeyValueEditor v-model="fields.config.headers" style="min-width: 70%" />
    </div>

    <!-- HTTP2 Fields -->
    <Http2Config v-if="fields.config.version === 2" v-model="fields.config.http2" />

    <!-- QUIC Fields -->
    <QuicConfig v-if="fields.config.version === 3" v-model="fields.config.quic" />

    <!-- TLS Fields -->
    <OutboundTlsConfig v-model="fields.config.tls" />

    <!-- Dial Fields -->
    <DialerConfig
      v-model="fields.config.dialer"
      :netns-options="netnsOptions"
      :outbound-options="outboundOptions"
      :dns-server-options="dnsServerOptions"
    />
  </Modal>
</template>
