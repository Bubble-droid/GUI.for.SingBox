<script lang="ts" setup>
import DialerForm from '@profile/components/shared/DialerForm.vue'
import ListenForm from '@profile/components/shared/ListenForm.vue'
import UdpNatForm from '@profile/components/shared/UdpNatForm.vue'
import { EndpointType } from '@profile/constant/kernel.ts'
import { EndpointOptions } from '@profile/constant/options.ts'
import { createEndpoint } from '@profile/defaults/endpoint.ts'
import type { EndpointItem } from '@profile/types/profiles/endpoint.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app.ts'
import { useBool } from '@/hooks/useBool.ts'
import { message } from '@/utils/interaction.ts'
import { deepClone } from '@/utils/others.ts'

import type { OptionItem } from '@/types/component.ts'

import OpenConnectForm from './components/OpenConnectForm.vue'
import OpenVpnClientForm from './components/OpenVpnClientForm.vue'
import OpenVpnServerForm from './components/OpenVpnServerForm.vue'
import TailScaleForm from './components/TailScaleForm.vue'
import WireGuardForm from './components/WireGuardForm.vue'

interface Props {
  netnsOptions: OptionItem[]
  inboundOptions: OptionItem[]
  outboundOptions: OptionItem[]
  dnsServerOptions: OptionItem[]
}

const model = defineModel<EndpointItem[]>({ required: true })
defineProps<Props>()
const { t } = useI18n()
const [showEditModal] = useBool(false)

let editIndex = -1
const fields = ref<EndpointItem>(createEndpoint(EndpointType.WireGuard))

const handleAdd = () => {
  editIndex = -1
  fields.value = createEndpoint(EndpointType.WireGuard)
  showEditModal.value = true
}

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

defineExpose({ handleAdd })
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

    <WireGuardForm v-if="fields.type === EndpointType.WireGuard" :model-value="fields.config" />
    <TailScaleForm
      v-else-if="fields.type === EndpointType.Tailscale"
      :model-value="fields.config"
    />
    <OpenConnectForm
      v-else-if="fields.type === EndpointType.OpenConnect"
      :model-value="fields.config"
    />
    <OpenVpnClientForm
      v-else-if="fields.type === EndpointType.OpenVpnClient"
      :model-value="fields.config"
    />
    <OpenVpnServerForm
      v-else-if="fields.type === EndpointType.OpenVpnServer"
      :model-value="fields.config"
    />

    <ListenForm
      v-if="'listen' in fields.config"
      v-model="fields.config.listen"
      :netns-options="netnsOptions"
      :inbound-options="inboundOptions"
    />
    <DialerForm
      v-if="'dialer' in fields.config"
      v-model="fields.config.dialer"
      :netns-options="netnsOptions"
      :outbound-options="outboundOptions"
      :dns-server-options="dnsServerOptions"
    />
    <UdpNatForm v-if="'udpNat' in fields.config" v-model="fields.config.udpNat" />
  </Modal>
</template>
