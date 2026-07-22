<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  DnsRcodeOptions,
  DnsServerOptions,
  EndpointOptions,
  IpVersionOptions,
  NetworkOptions,
  NetworkTypeOptions,
  OutboundOptions,
  PredefinedClashModeOptions,
  QuicClientOptions,
  SniffProtocolOptions,
  DraggableOptions,
} from '@/constant'
import {
  ClashMode,
  CommonRuleType,
  DnsRuleType,
  DnsServer,
  Network,
  Outbound,
  RouteRuleType,
} from '@/enums'
import { deepClone, formatRecord } from '@/utils'

import type { RouteRuleItem, DnsRuleItem, ComponentOption } from '@/types'

interface Props {
  options: ComponentOption[]
  inboundOptions: ComponentOption[]
  ruleSetOptions: ComponentOption[]
  location: 'route' | 'dns'
}

const props = defineProps<Props>()

const model = defineModel<Array<RouteRuleItem | DnsRuleItem>>({ required: true })
const { t } = useI18n()

const showConditionModal = ref(false)
const editIndex = ref(-1)
const editItem = ref<RouteRuleItem | DnsRuleItem>({ type: CommonRuleType.Domain, value: [] })

const handleAdd = () => {
  editIndex.value = -1
  editItem.value = { type: CommonRuleType.Domain, value: [] } as any
  showConditionModal.value = true
}

const handleEdit = (index: number) => {
  editIndex.value = index
  editItem.value = deepClone(model.value[index]!)
  showConditionModal.value = true
}

const handleRemove = (index: number) => {
  model.value.splice(index, 1)
}

const handleConditionOk = () => {
  if (editIndex.value === -1) {
    model.value.push(editItem.value)
  } else {
    model.value[editIndex.value] = editItem.value
  }
}

const onTypeChange = (item: RouteRuleItem | DnsRuleItem, newType: RouteRuleType | DnsRuleType) => {
  item.type = newType as any
  const boolTypes = [
    CommonRuleType.Invert,
    CommonRuleType.NetworkIsExpensive,
    CommonRuleType.NetworkIsConstrained,
    CommonRuleType.IpIsPrivate,
    CommonRuleType.SourceIpIsPrivate,
    CommonRuleType.RuleSetIpCidrMatchSource,
    DnsRuleType.IpAcceptAny,
    DnsRuleType.MatchResponse,
  ]
  const stringTypes = [
    CommonRuleType.IpVersion,
    CommonRuleType.ClashMode,
    DnsRuleType.ResponseRcode,
  ]
  const mapTypes = [CommonRuleType.InterfaceAddress, CommonRuleType.NetworkInterfaceAddress]

  if (boolTypes.includes(newType as any)) {
    item.value = false
  } else if (stringTypes.includes(newType as any)) {
    item.value = ''
  } else if (mapTypes.includes(newType as any)) {
    item.value = {}
  } else {
    item.value = []
  }
}

const isConditionInvalid = (item: RouteRuleItem | DnsRuleItem) => {
  if (item.type === CommonRuleType.Inbound) {
    return item.value.some((v) => !props.inboundOptions.some((o) => o.value === v))
  }
  if (item.type === CommonRuleType.RuleSet) {
    return item.value.some((v) => !props.ruleSetOptions.some((o) => o.value === v))
  }
  return false
}

const renderConditionValue = (item: RouteRuleItem | DnsRuleItem) => {
  if (item.type === CommonRuleType.Inbound) {
    return item.value.map((v) => props.inboundOptions.find((o) => o.value === v)?.label).join(', ')
  }
  if (item.type === CommonRuleType.RuleSet) {
    return item.value.map((v) => props.ruleSetOptions.find((o) => o.value === v)?.label).join(', ')
  }

  if (typeof item.value === 'boolean') return item.value ? 'True' : 'False'
  if (Array.isArray(item.value)) return item.value.join(', ')
  if (typeof item.value === 'object' && item.value !== null) return formatRecord(item.value)
  return item.value
}

const getOptionLabel = (type: string) => {
  return props.options.find((o) => o.value === type)?.label || type
}

const RoutePreferredByOptions = [
  ...EndpointOptions,
  OutboundOptions.find((v) => v.value === Outbound.Bridge)!,
]

const DnsPreferredByOptions = DnsServerOptions.filter((v) =>
  [
    DnsServer.Hosts,
    DnsServer.Local,
    DnsServer.Mdns,
    DnsServer.Tailscale,
    DnsServer.Resolved,
  ].includes(v.value as any),
)

const clashModeSelect = computed({
  get() {
    const isPredefined = PredefinedClashModeOptions.some(
      (opt) =>
        editItem.value.type === DnsRuleType.ClashMode &&
        opt.value === editItem.value.value &&
        opt.value !== ClashMode.Custom,
    )
    return isPredefined ? editItem.value.value : ClashMode.Custom
  },
  set(val) {
    if (val === ClashMode.Custom) {
      editItem.value.value = ''
    } else {
      editItem.value.value = val
    }
  },
})

const isCustomClashMode = computed(
  () => editItem.value.type === DnsRuleType.ClashMode && clashModeSelect.value === ClashMode.Custom,
)
</script>

<template>
  <Empty v-if="model.length === 0" class="py-2" />

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(item, index) in model" :key="index" class="mb-2">
      <div class="flex items-center py-2 gap-8">
        <div class="font-bold shrink-0">
          <span
            v-if="isConditionInvalid(item)"
            :style="{ color: 'rgb(200, 193, 11)' }"
            :title="t('kernel.outbounds.notFound')"
          >
            [ ! ]
          </span>
          <Tag>
            {{ t(getOptionLabel(item.type)) }}
          </Tag>
        </div>
        <div
          style="
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          "
          :title="renderConditionValue(item)"
        >
          {{ renderConditionValue(item) }}
        </div>

        <div class="ml-auto shrink-0">
          <Button icon="edit" type="text" size="small" @click="handleEdit(index)" />
          <Button icon="delete" type="text" size="small" @click="handleRemove(index)" />
        </div>
      </div>
    </Card>
  </div>

  <div class="flex items-center justify-center mt-8">
    <Button icon="add" type="primary" size="small" @click="handleAdd">{{
      t('kernel.rules.condition.add')
    }}</Button>
  </div>

  <Teleport to="body">
    <Modal
      v-model:open="showConditionModal"
      :on-ok="handleConditionOk"
      title="kernel.rules.condition.title"
      width="65"
    >
      <div class="form-item items-start">
        {{ t('kernel.rules.condition.type.title') }}
        <Select
          :model-value="editItem.type"
          :options="options"
          @update:model-value="onTypeChange(editItem, $event)"
        />
      </div>

      <div class="form-item items-start">
        <div class="font-bold flex items-center">
          <span
            v-if="isConditionInvalid(editItem)"
            :style="{ color: 'rgb(200, 193, 11)' }"
            :title="t('kernel.outbounds.notFound')"
          >
            [ ! ]
          </span>
          {{ t('kernel.rules.condition.payload') }}
        </div>

        <div style="max-width: 320px">
          <Switch v-if="typeof editItem.value === 'boolean'" v-model="editItem.value" />

          <Select
            v-else-if="editItem.type === CommonRuleType.ClashMode"
            v-model="clashModeSelect as string"
            :options="PredefinedClashModeOptions.filter((v) => v.value !== ClashMode.Rule)"
          />

          <MultipleSelect
            v-else-if="editItem.type === CommonRuleType.NetworkType"
            v-model="editItem.value"
            :options="NetworkTypeOptions"
            clearable
          />
          <Select
            v-else-if="editItem.type === CommonRuleType.IpVersion"
            v-model="editItem.value"
            :options="IpVersionOptions"
            clearable
          />
          <MultipleSelect
            v-else-if="editItem.type === CommonRuleType.Protocol"
            v-model="editItem.value"
            :options="SniffProtocolOptions"
            clearable
          />
          <MultipleSelect
            v-else-if="editItem.type === CommonRuleType.Inbound"
            v-model="editItem.value"
            :options="inboundOptions"
            clearable
          />
          <MultipleSelect
            v-else-if="editItem.type === CommonRuleType.RuleSet"
            v-model="editItem.value"
            :options="ruleSetOptions"
            clearable
          />
          <KeyValueEditor
            v-else-if="
              editItem.type === CommonRuleType.InterfaceAddress ||
              editItem.type === CommonRuleType.NetworkInterfaceAddress
            "
            v-model="editItem.value"
          />
          <MultipleSelect
            v-else-if="editItem.type === RouteRuleType.Network && location === 'route'"
            v-model="editItem.value"
            :options="NetworkOptions"
            clearable
          />
          <MultipleSelect
            v-else-if="editItem.type === RouteRuleType.Client"
            v-model="editItem.value"
            :options="QuicClientOptions"
            clearable
          />
          <MultipleSelect
            v-else-if="editItem.type === RouteRuleType.PreferredBy && location === 'route'"
            v-model="editItem.value"
            :options="RoutePreferredByOptions"
            clearable
          />
          <Select
            v-else-if="editItem.type === DnsRuleType.ResponseRcode"
            v-model="editItem.value"
            :options="DnsRcodeOptions"
            clearable
          />
          <MultipleSelect
            v-else-if="editItem.type === RouteRuleType.Network && location === 'dns'"
            v-model="editItem.value"
            :options="NetworkOptions.filter((v) => v.value !== Network.Icmp)"
            clearable
          />
          <MultipleSelect
            v-else-if="editItem.type === DnsRuleType.PreferredBy && location === 'dns'"
            v-model="editItem.value"
            :options="DnsPreferredByOptions"
            clearable
          />
          <Input v-else-if="typeof editItem.value === 'string'" v-model="(editItem as any).value" />
          <InputList v-else-if="Array.isArray(editItem.value)" v-model="editItem.value" />
        </div>
      </div>

      <div v-if="isCustomClashMode" class="form-item items-start">
        {{ t('kernel.rules.clash_mode.custom') }}
        <Input v-model.lazy="editItem.value as string" clearable />
      </div>
    </Modal>
  </Teleport>
</template>
