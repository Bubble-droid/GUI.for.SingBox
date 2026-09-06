<script lang="ts" setup>
import type { DomainStrategy } from '@profile/constant/kernel'
import {
  DnsRuleType,
  DnsActionKind,
  DnsRejectMethod,
  ClashMode,
  RuleSetFormat,
  RuleSetType,
} from '@profile/constant/kernel'
import {
  DnsRejectMethodOptions,
  DnsRuleActionOptions,
  DnsRuleTypeOptions,
  DomainStrategyOptions,
} from '@profile/constant/options'
import { createDnsRule } from '@profile/defaults/dns'
import type { DnsRuleItem } from '@profile/types/profiles/dns'
import type { RuleSetItem } from '@profile/types/profiles/route'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { useBool } from '@/hooks/useBool'
import { message } from '@/utils/interaction'
import { isValidJson } from '@/utils/is'
import { deepClone } from '@/utils/others'

import type { OptionItem } from '@/types/component'

interface Props {
  inboundOptions: OptionItem[]
  dnsServerOptions: OptionItem[]
  ruleSet: RuleSetItem[]
}

const model = defineModel<DnsRuleItem[]>({ required: true })

const { inboundOptions, dnsServerOptions, ruleSet } = defineProps<Props>()

let ruleId = 0
const fields = ref<DnsRuleItem>(createDnsRule())

const isInsertionPointMissing = computed(
  () => !model.value.some((rule) => rule.type === DnsRuleType.InsertionPoint),
)

const { t } = useI18n()
const [showEditModal] = useBool(false)

const handleAdd = () => {
  ruleId = -1
  fields.value = createDnsRule()
  showEditModal.value = true
}

const handleAddEnd = () => {
  if (ruleId === -1) {
    const index = model.value.findIndex((v) => v.type === DnsRuleType.InsertionPoint)
    if (index === -1) {
      model.value.unshift(fields.value)
    } else {
      model.value.splice(index + 1, 0, fields.value)
    }
  } else {
    model.value[ruleId] = fields.value
  }
}

const handleEdit = (index: number) => {
  ruleId = index
  fields.value = deepClone(model.value[index]!)
  showEditModal.value = true
}

const handleAddInsertionPoint = () => {
  model.value.unshift({
    id: DnsRuleType.InsertionPoint,
    type: DnsRuleType.InsertionPoint,
    enable: true,
    payload: '',
    action: DnsActionKind.Route,
    server: '',
    invert: false,
    strategy: '' as DomainStrategy,
    disable_cache: false,
    client_subnet: '',
  })
}

const handleDeleteRule = (index: number) => {
  model.value.splice(index, 1)
}

const handleUse = (ruleset: any) => {
  const ids = fields.value.payload.split(',').filter(Boolean)
  const idx = ids.indexOf(ruleset.id)
  if (idx === -1) {
    ids.push(ruleset.id)
  } else {
    ids.splice(idx, 1)
  }
  fields.value.payload = ids.join(',')
}

const handleClearRuleset = (ruleset: any) => {
  const ids = fields.value.payload.split(',').filter((id) => ruleSet.find((v) => v.id === id))
  ruleset.payload = ids.join(',')
}

const showLost = () => message.warn('kernel.route.rules.invalid')

const hasLost = (rule: DnsRuleItem) => {
  const checkServer = () => {
    if (rule.action === DnsActionKind.Route) {
      if (!dnsServerOptions.some((v) => v.value === rule.server)) {
        return true
      }
      return false
    } else if (
      [DnsActionKind.RouteOptions, DnsActionKind.Predefined].includes(rule.action as any)
    ) {
      return !isValidJson(rule.server)
    } else if (rule.action === DnsActionKind.Reject) {
      return ![DnsRejectMethod.Default, DnsRejectMethod.Drop].includes(rule.server as any)
    }
    return false
  }

  const checkPayload = () => {
    if (rule.type === DnsRuleType.Inbound) {
      return !inboundOptions.some((v) => v.value === rule.payload)
    }
    if (rule.type === DnsRuleType.RuleSet) {
      const hasMissingRuleset = rule.payload
        .split(',')
        .some((id) => !ruleSet.some((v) => v.id === id))
      return hasMissingRuleset
    }
    if (rule.type === DnsRuleType.Inline) {
      return !isValidJson(rule.payload)
    }
    return !rule.payload
  }

  return checkServer() || checkPayload()
}

const renderRule = (rule: DnsRuleItem) => {
  const { type, payload, server, action, invert } = rule
  const children: string[] = [type]
  let _payload = payload
  if (type === DnsRuleType.RuleSet) {
    _payload = rule.payload
      .split(',')
      .map((id) => ruleSet.find((v) => v.id === id)?.tag || id)
      .join(',')
  } else if (type === DnsRuleType.Inline && payload.includes('__is_fake_ip')) {
    _payload = 'FakeIP'
  }
  if (invert) {
    _payload += ` (invert) `
  }
  children.push(_payload, action)
  if (server) {
    const proxy = dnsServerOptions.find((v) => v.value === server)?.label || server
    children.push(proxy)
  }
  return children.join(',')
}

defineExpose({ handleAdd })
</script>
<template>
  <Empty v-if="model.length === 0 || (model.length === 1 && !isInsertionPointMissing)">
    <template #description>
      <Button icon="add" type="primary" size="small" @click="handleAdd">
        {{ t('common.add') }}
      </Button>
    </template>
  </Empty>

  <Divider v-if="isInsertionPointMissing">
    <Button type="text" size="small" @click="handleAddInsertionPoint">
      {{ t('kernel.addInsertionPoint') }}
    </Button>
  </Divider>

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(rule, index) in model" :key="rule.id" class="mb-2">
      <div v-if="rule.type === DnsRuleType.InsertionPoint" class="text-center font-bold">
        <Divider class="cursor-move">
          <Button icon="add" type="text" size="small" @click="handleAdd">
            {{ t('kernel.insertionPoint') }}
          </Button>
        </Divider>
      </div>
      <div v-else class="flex items-start py-2 gap-8">
        <div class="shrink-0">
          <Switch v-model="rule.enable" border="square" size="small" />
        </div>
        <div class="font-bold flex-1 rule-content">
          <span v-if="hasLost(rule)" class="warn cursor-pointer" @click="showLost"> [ ! ] </span>
          {{ renderRule(rule) }}
        </div>
        <div class="ml-auto shrink-0">
          <Button
            v-if="rule.type === DnsRuleType.RuleSet && rule.payload && hasLost(rule)"
            size="small"
            type="text"
            @click="handleClearRuleset(rule)"
          >
            {{ t('common.clear') }}
          </Button>
          <Button icon="edit" type="text" size="small" @click="handleEdit(index)" />
          <Button icon="delete" type="text" size="small" @click="handleDeleteRule(index)" />
        </div>
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    :on-ok="handleAddEnd"
    title="kernel.dns.tab.rules"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.dns.rules.type') }}
      <Select v-model="fields.type" :options="DnsRuleTypeOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.rules.action') }}
      <Radio v-model="fields.action" :options="DnsRuleActionOptions" />
    </div>
    <div v-if="fields.type !== DnsRuleType.RuleSet" class="form-item">
      {{ t('kernel.dns.rules.payload') }}
      <Radio
        v-if="fields.type === DnsRuleType.ClashMode"
        v-model="fields.payload"
        :options="[
          {
            label: 'kernel.global',
            value: ClashMode.Global,
          },
          {
            label: 'kernel.direct',
            value: ClashMode.Direct,
          },
        ]"
      />
      <Select
        v-else-if="fields.type === DnsRuleType.Inbound"
        v-model="fields.payload"
        :options="inboundOptions"
      />
      <CodeEditor
        v-else-if="fields.type === DnsRuleType.Inline"
        v-model="fields.payload"
        editable
        lang="json"
        style="min-width: 320px"
      />
      <Switch
        v-else-if="[DnsRuleType.IpIsPrivate, DnsRuleType.IpAcceptAny].includes(fields.type as any)"
        :model-value="fields.payload === 'true'"
        @change="(val) => (fields.payload = val ? 'true' : 'false')"
      />
      <Input v-else v-model="fields.payload" autofocus />
    </div>
    <div class="form-item">
      {{ t('kernel.route.rules.invert') }}
      <Switch v-model="fields.invert" />
    </div>
    <Card class="mt-4 mb-16">
      <template v-if="fields.action === DnsActionKind.Route">
        <div class="form-item">
          {{ t('kernel.dns.rules.server') }}
          <Select v-model="fields.server" :options="dnsServerOptions" />
        </div>
        <div class="form-item">
          {{ t('kernel.route.rules.strategy') }}
          <Select v-model="fields.strategy" :options="DomainStrategyOptions" />
        </div>
      </template>
      <template v-else-if="fields.action === DnsActionKind.RouteOptions">
        <div class="form-item">
          {{ t('kernel.route.rules.routeOptions') }}
          <CodeEditor v-model="fields.server" editable lang="json" style="min-width: 320px" />
        </div>
      </template>
      <template v-else-if="fields.action === DnsActionKind.Reject">
        <div class="form-item">
          {{ t('kernel.route.rules.action.rejectMethod') }}
          <Radio v-model="fields.server" :options="DnsRejectMethodOptions" />
        </div>
      </template>
      <template v-else-if="fields.action === DnsActionKind.Predefined">
        <div class="form-item">
          {{ t('kernel.route.rules.action.predefined') }}
          <CodeEditor v-model="fields.server" editable lang="json" style="min-width: 320px" />
        </div>
      </template>
      <template
        v-if="[DnsActionKind.Route, DnsActionKind.RouteOptions].includes(fields.action as any)"
      >
        <div class="form-item">
          {{ t('kernel.route.rules.disable_cache') }}
          <Switch v-model="fields.disable_cache" />
        </div>
        <div class="form-item">
          {{ t('kernel.route.rules.client_subnet') }}
          <Input v-model="fields.client_subnet" editable />
        </div>
      </template>
    </Card>
    <template v-if="fields.type === DnsRuleType.RuleSet">
      <Divider>{{ t('kernel.route.tab.rule_set') }}</Divider>
      <Empty v-if="ruleSet.length === 0" :description="t('kernel.route.rule_set.empty')" />
      <div class="grid grid-cols-3 gap-8">
        <Card
          v-for="ruleset in ruleSet"
          :key="ruleset.tag"
          v-tips="ruleset.type"
          :title="ruleset.tag"
          :selected="fields.payload.includes(ruleset.id)"
          class="text-12 line-clamp-1"
          @click="handleUse(ruleset)"
        >
          {{ ruleset.type }}
          {{ ruleset.type === RuleSetType.Inline ? RuleSetFormat.Source : ruleset.format }}
        </Card>
      </div>
    </template>
  </Modal>
</template>

<style lang="less" scoped>
.warn {
  color: rgb(200, 193, 11);
}

.rule-content {
  min-width: 0;
  word-break: break-all;
}
</style>
