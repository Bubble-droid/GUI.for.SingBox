<script lang="ts" setup>
import DialerConfig from '@profile/components/Shared/DialerConfig.vue'
import ListenConfig from '@profile/components/Shared/ListenConfig.vue'
import UdpNatConfig from '@profile/components/Shared/UdpNatConfig.vue'
import { EndpointType } from '@profile/constant/kernel.ts'
import { EndpointOptions } from '@profile/constant/options.ts'
import { createEndpoint } from '@profile/defaults/endpoints.ts'
import type { EndpointItem } from '@profile/types/profiles/endpoints.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app.ts'
import { useBool } from '@/hooks/useBool.ts'
import { message } from '@/utils/interaction.ts'
import { deepClone } from '@/utils/others.ts'

import type { OptionItem } from '@/types/component.ts'

import OpenConnect from './OpenConnect.vue'
import OpenVpnClient from './OpenVpnClient.vue'
import OpenVpnServer from './OpenVpnServer.vue'
import TailScale from './TailScale.vue'
import WireGuard from './WireGuard.vue'

interface Props {
  netnsOptions: OptionItem[]
  inboundOptions: OptionItem[]
  outboundOptions: OptionItem[]
  dnsServerOptions: OptionItem[]
}

defineProps<Props>()
const model = defineModel<EndpointItem[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<EndpointItem>(createEndpoint(EndpointType.WireGuard))

const handleAdd = () => {
  editIndex = -1
  fields.value = createEndpoint(EndpointType.WireGuard)
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

const onTypeChange = (newType: EndpointType) => {
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

    <WireGuard v-if="fields.type === EndpointType.WireGuard" :model-value="fields.config" />
    <TailScale v-else-if="fields.type === EndpointType.Tailscale" :model-value="fields.config" />
    <OpenConnect
      v-else-if="fields.type === EndpointType.OpenConnect"
      :model-value="fields.config"
    />
    <OpenVpnClient
      v-else-if="fields.type === EndpointType.OpenVpnClient"
      :model-value="fields.config"
    />
    <OpenVpnServer
      v-else-if="fields.type === EndpointType.OpenVpnServer"
      :model-value="fields.config"
    />

    <ListenConfig
      v-if="'listen' in fields.config"
      v-model="fields.config.listen"
      :netns-options="netnsOptions"
      :inbound-options="inboundOptions"
    />
    <DialerConfig
      v-if="'dialer' in fields.config"
      v-model="fields.config.dialer"
      :netns-options="netnsOptions"
      :outbound-options="outboundOptions"
      :dns-server-options="dnsServerOptions"
    />
    <UdpNatConfig v-if="'udpNat' in fields.config" v-model="fields.config.udpNat" />
  </Modal>
</template>
