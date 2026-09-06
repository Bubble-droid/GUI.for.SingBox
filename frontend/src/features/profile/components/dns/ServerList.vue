<script lang="ts" setup>
import { DnsServerType } from '@profile/constant/kernel'
import { DnsServerTypeOptions } from '@profile/constant/options'
import { createDnsServer } from '@profile/defaults/dns'
import { generateDnsServerURL } from '@profile/transformers/generator/dns'
import type { DnsServerItem } from '@profile/types/profiles/dns'
import { computed, h, ref } from 'vue'
import type { VNode } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { useBool } from '@/hooks/useBool'
import { deepClone } from '@/utils/others'

import Tag from '@/components/Tag/index.vue'

import type { OptionItem } from '@/types/component'

interface Props {
  outboundOptions: OptionItem[]
  dnsServersOptions: OptionItem[]
}

const model = defineModel<DnsServerItem[]>({ required: true })

const { outboundOptions } = defineProps<Props>()

let serverId = 0
const fields = ref<DnsServerItem>(createDnsServer())

const isSupportDetourAndDomainResolver = computed(() =>
  [
    DnsServerType.Local,
    DnsServerType.Tcp,
    DnsServerType.Udp,
    DnsServerType.Tls,
    DnsServerType.Quic,
    DnsServerType.Https,
    DnsServerType.H3,
    DnsServerType.Dhcp,
  ].includes(fields.value.type as any),
)

const isSupportServerAndPort = computed(() =>
  [
    DnsServerType.Tcp,
    DnsServerType.Udp,
    DnsServerType.Tls,
    DnsServerType.Quic,
    DnsServerType.Https,
    DnsServerType.H3,
  ].includes(fields.value.type as any),
)

const isSupportPath = computed(() =>
  [DnsServerType.Https, DnsServerType.H3].includes(fields.value.type as any),
)

const { t } = useI18n()
const [showEditModal] = useBool(false)

const handleAdd = () => {
  serverId = -1
  fields.value = createDnsServer()
  showEditModal.value = true
}

const handleAddEnd = () => {
  if (serverId === -1) {
    model.value.unshift(fields.value)
  } else {
    model.value[serverId] = fields.value
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

const renderServer = (server: DnsServerItem) => {
  const { tag, detour } = server
  const children: VNode[] = [
    h(Tag, { color: 'cyan' }, () => tag),
    h(Tag, () => generateDnsServerURL(server)),
  ]
  if (detour) {
    const detourLabel = outboundOptions.find((v) => v.value === detour)?.label || detour
    children.push(h(Tag, { color: 'default' }, () => detourLabel))
  }
  return h('div', { class: 'font-bold' }, children)
}

defineExpose({ handleAdd })
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
        <div class="ml-auto">
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
    <div class="flex flex-col">
      <div class="form-item">
        {{ t('kernel.dns.type.name') }}
        <Select v-model="fields.type" :options="DnsServerTypeOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.tag') }}
        <Input v-model="fields.tag" autofocus />
      </div>
      <template v-if="isSupportDetourAndDomainResolver">
        <div class="form-item">
          {{ t('kernel.dns.domain_resolver') }}
          <Select v-model="fields.domain_resolver" :options="dnsServersOptions" clearable />
        </div>
        <div class="form-item">
          {{ t('kernel.dns.detour') }}
          <Select v-model="fields.detour" :options="outboundOptions" clearable />
        </div>
        <template v-if="isSupportServerAndPort">
          <div class="form-item">
            {{ t('kernel.dns.server') }}
            <Input v-model="fields.server" placeholder="192.168.1.1,223.5.5.5" />
          </div>
          <div class="form-item">
            {{ t('kernel.dns.server_port') }}
            <Input v-model="fields.server_port" placeholder="53,853,443,784" />
          </div>
          <div v-if="isSupportPath" class="form-item">
            {{ t('kernel.dns.path') }}
            <Input v-model="fields.path" placeholder="/dns-query" />
          </div>
        </template>
      </template>
      <template v-if="fields.type === DnsServerType.Hosts">
        <div :class="{ 'items-start': fields.hosts_path.length !== 0 }" class="form-item">
          {{ t('kernel.dns.hosts_path') }}
          <InputList v-model="fields.hosts_path" placeholder="/etc/hosts,c:\...\hosts" />
        </div>
        <div
          :class="{ 'items-start': Object.keys(fields.predefined).length !== 0 }"
          class="form-item"
        >
          {{ t('kernel.dns.predefined') }}
          <KeyValueEditor
            v-model="fields.predefined"
            :placeholder="['google.com', '127.0.0.1,::1']"
          />
        </div>
      </template>
      <div v-else-if="fields.type === DnsServerType.Dhcp" class="form-item">
        {{ t('kernel.dns.interface') }}
        <Input v-model="fields.interface" placeholder="wlan0,eth0" />
      </div>
      <template v-else-if="fields.type === DnsServerType.FakeIp">
        <div class="form-item">
          {{ t('kernel.dns.inet4_range') }}
          <Input v-model="fields.inet4_range" placeholder="198.18.0.0/15" clearable>
            <template #suffix>
              <Button
                size="small"
                type="text"
                icon="reset"
                @click="fields.inet4_range = '198.18.0.0/15'"
              />
            </template>
          </Input>
        </div>
        <div class="form-item">
          {{ t('kernel.dns.inet6_range') }}
          <Input v-model="fields.inet6_range" placeholder="fc00::/18" clearable>
            <template #suffix>
              <Button
                size="small"
                type="text"
                icon="reset"
                @click="fields.inet6_range = 'fc00::/18'"
              />
            </template>
          </Input>
        </div>
      </template>
    </div>
  </Modal>
</template>
