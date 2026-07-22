<script lang="ts" setup>
import { h, ref, type VNode } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions, getDefaultDnsServer } from '@/constant'
import { DnsServerOptions } from '@/constant/kernel'
import { DnsServer } from '@/enums'
import { useBool } from '@/hooks'
import { deepClone, generateDnsServerUrl } from '@/utils'

import Tag from '@/components/Tag/index.vue'

import type { Dialer, DnsServerProfile } from '@/types'

import DialerConfig from './Shared/DialerConfig.vue'
import RawFieldsConfig from './Shared/RawFieldsConfig.vue'

interface Props {
  outboundOptions: { label: string; value: string }[]
  serversOptions: { label: string; value: string }[]
}

const props = defineProps<Props>()

const model = defineModel<DnsServerProfile[]>({ required: true })

let serverId = -1
const fields = ref<DnsServerProfile>(getDefaultDnsServer(DnsServer.Local))

const supportedPath = new Set([DnsServer.Https, DnsServer.H3])

const supportedServer = new Set([
  ...supportedPath,
  DnsServer.Tcp,
  DnsServer.Udp,
  DnsServer.Tls,
  DnsServer.Quic,
])

const supportedDialer = new Set([
  ...supportedServer,
  DnsServer.Local,
  DnsServer.Dhcp,
  DnsServer.Mdns,
])

const isDialerSupported = (
  server: DnsServerProfile,
): server is Extract<DnsServerProfile, { config: { dialer: Dialer } }> => {
  return supportedDialer.has(server.type as any)
}

const isServerSupported = (
  server: DnsServerProfile,
): server is Extract<DnsServerProfile, { config: { server: string } }> => {
  return supportedServer.has(server.type as any)
}

const isPathSupported = (
  server: DnsServerProfile,
): server is Extract<DnsServerProfile, { config: { path: string } }> => {
  return supportedPath.has(server.type as any)
}

const { t } = useI18n()
const [showEditModal] = useBool(false)

const handleAdd = () => {
  serverId = -1
  fields.value = getDefaultDnsServer(DnsServer.Local)
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleAddEnd = () => {
  if (serverId !== -1) {
    model.value[serverId] = fields.value
  } else {
    model.value.unshift(fields.value)
  }
}

const handleEdit = (index: number) => {
  serverId = index
  fields.value = deepClone(model.value[index]!)
  showEditModal.value = true
}

const handleDeleteRule = (index: number) => {
  model.value.splice(index, 1)
}

const onTypeChange = (newType: DnsServer) => {
  const base = { id: fields.value.id }
  fields.value = { ...getDefaultDnsServer(newType), ...base } as DnsServerProfile
}

const renderServer = (server: DnsServerProfile) => {
  const { tag } = server
  const children: VNode[] = [
    h(Tag, { color: 'cyan' }, () => tag),
    h(Tag, () => generateDnsServerUrl(server)),
  ]

  if (isDialerSupported(server)) {
    const detourTag = props.outboundOptions.find(
      (v) => v.value === server.config.dialer.detour,
    )?.label
    if (detourTag) children.push(h(Tag, { color: 'default' }, () => detourTag))
  }
  return h('div', { class: 'font-bold' }, children)
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
    <Card v-for="(server, index) in model" :key="server.id" class="mb-2">
      <div class="flex items-center py-2">
        <component :is="renderServer(server)" />
        <div class="ml-auto shrink-0">
          <Button icon="edit" type="text" size="small" @click="handleEdit(index)" />
          <Button icon="delete" type="text" size="small" @click="handleDeleteRule(index)" />
        </div>
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    :on-ok="handleAddEnd"
    title="kernel.dns.tab.servers"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.dns.servers.type.title') }}
      <Select
        :model-value="fields.type"
        :options="DnsServerOptions"
        @update:model-value="onTypeChange"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.servers.tag') }}
      <Input v-model="fields.tag" autofocus />
    </div>

    <template v-if="isServerSupported(fields)">
      <div class="form-item">
        {{ t('kernel.dns.servers.server') }}
        <Input v-model="fields.config.server" placeholder="192.168.1.1,223.5.5.5" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.servers.server_port') }}
        <Input
          v-model="(fields.config as any).server_port"
          type="number"
          placeholder="53,853,443"
          editable
          clearable
        />
      </div>
    </template>

    <template v-if="isPathSupported(fields)">
      <div class="form-item">
        {{ t('kernel.dns.servers.path') }}
        <Input v-model="fields.config.path" placeholder="/dns-query" editable clearable />
      </div>
    </template>

    <template v-if="fields.type === DnsServer.Local">
      <div class="form-item">
        {{ t('kernel.dns.servers.local.prefer_go') }}
        <Switch v-model="fields.config.prefer_go" />
      </div>
      <div class="form-item items-start">
        {{ t('kernel.dns.servers.local.neighbor_domain') }}
        <InputList v-model="fields.config.neighbor_domain" />
      </div>
    </template>
    <template v-if="fields.type === DnsServer.Hosts">
      <div :class="{ 'items-start': fields.config.path.length !== 0 }" class="form-item">
        {{ t('kernel.dns.servers.hosts.path') }}
        <InputList v-model="fields.config.path" placeholder="/etc/hosts,c:\...\hosts" />
      </div>
      <div
        :class="{ 'items-start': Object.keys(fields.config.predefined).length !== 0 }"
        class="form-item"
      >
        {{ t('kernel.dns.servers.hosts.predefined') }}
        <KeyValueEditor
          v-model="fields.config.predefined"
          :placeholder="['google.com', '127.0.0.1,::1']"
        />
      </div>
    </template>

    <template v-if="fields.type === DnsServer.Dhcp">
      <div class="form-item">
        {{ t('kernel.dns.servers.dhcp.interface') }}
        <Input v-model="fields.config.interface" placeholder="wlan0,eth0" editable clearable />
      </div>
    </template>

    <template v-else-if="fields.type === DnsServer.FakeIp">
      <div class="form-item">
        {{ t('kernel.dns.servers.fakeip.inet4_range') }}
        <Input v-model="fields.config.inet4_range" placeholder="198.18.0.0/15" editable clearable>
          <template #suffix>
            <Button
              size="small"
              type="text"
              icon="reset"
              @click="fields.config.inet4_range = '198.18.0.0/15'"
            />
          </template>
        </Input>
      </div>
      <div class="form-item">
        {{ t('kernel.dns.servers.fakeip.inet6_range') }}
        <Input v-model="fields.config.inet6_range" placeholder="fc00::/18" editable clearable>
          <template #suffix>
            <Button
              size="small"
              type="text"
              icon="reset"
              @click="fields.config.inet6_range = 'fc00::/18'"
            />
          </template>
        </Input>
      </div>
    </template>

    <template v-if="isDialerSupported(fields)">
      <DialerConfig
        v-model="fields.config.dialer"
        :outbound-options="outboundOptions"
        :server-options="serversOptions"
      />
    </template>
    <RawFieldsConfig v-model="fields.fields" />
  </Modal>
</template>
