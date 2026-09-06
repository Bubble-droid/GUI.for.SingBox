<script lang="ts" setup>
import type { DomainStrategy } from '@profile/constant/kernel'
import {
  RouteRuleType,
  ClashMode,
  RuleSetType,
  RuleSetFormat,
  RouteActionKind,
} from '@profile/constant/kernel'
import {
  DomainStrategyOptions,
  RouteRejectMethodOptions,
  RouteRuleActionOptions,
  RouteRuleTypeOptions,
  SniffProtocolOptions,
} from '@profile/constant/options'
import { createRouteRule } from '@profile/defaults/route'
import type { RouteRuleItem, RuleSetItem } from '@profile/types/profiles/route'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { useBool } from '@/hooks/useBool'
import { message } from '@/utils/interaction'
import { deepClone } from '@/utils/others'

import type { OptionItem } from '@/types/component'

interface Props {
  inboundOptions: OptionItem[]
  outboundOptions: OptionItem[]
  dnsServerOptions: OptionItem[]
  ruleSet: RuleSetItem[]
}

const model = defineModel<RouteRuleItem[]>({ required: true })

const { inboundOptions, outboundOptions, ruleSet } = defineProps<Props>()

let ruleId = 0
const fields = ref<RouteRuleItem>(createRouteRule())

const { t } = useI18n()
const [showEditModal] = useBool(false)

const handleAdd = () => {
  ruleId = -1
  fields.value = createRouteRule()
  showEditModal.value = true
}

const handleAddInsertionPoint = () => {
  model.value.unshift({
    id: RouteRuleType.InsertionPoint,
    type: RouteRuleType.InsertionPoint,
    enable: true,
    payload: '',
    invert: false,
    action: RouteActionKind.Sniff,
    outbound: '',
    sniffer: [],
    strategy: '' as DomainStrategy,
    server: '',
  })
}

const handleAddEnd = () => {
  if (ruleId === -1) {
    const index = model.value.findIndex((v) => v.type === RouteRuleType.InsertionPoint)
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

const handleDelete = (index: number) => {
  model.value.splice(index, 1)
}

const showLost = () => message.warn('kernel.route.rules.invalid')

const isSupportPayload = computed(() => ![RouteRuleType.RuleSet].includes(fields.value.type as any))

const isInsertionPointMissing = computed(
  () => !model.value.some((rule) => rule.type === RouteRuleType.InsertionPoint),
)

const hasLost = (rule: RouteRuleItem) => {
  const rulesValidationFlags: boolean[] = []
  const hasMissingInbound = !inboundOptions.some((v) => v.value === rule.payload)
  const hasMissingOutbound = !outboundOptions.some((v) => v.value === rule.outbound)
  const hasMissingRuleset = rule.payload.split(',').some((id) => !ruleSet.some((v) => v.id === id))
  if (rule.action === RouteActionKind.Route) {
    rulesValidationFlags.push(hasMissingOutbound)
  } else if (rule.action === RouteActionKind.RouteOptions) {
    let isValid = true
    try {
      JSON.parse(rule.outbound)
    } catch {
      isValid = false
    }
    rulesValidationFlags.push(!isValid)
  }
  if (rule.type === RouteRuleType.Inbound) {
    rulesValidationFlags.push(hasMissingInbound)
  } else if (rule.type === RouteRuleType.IpIsPrivate) {
    rulesValidationFlags.push(!['true', 'false'].includes(rule.payload))
  } else if (rule.type === RouteRuleType.RuleSet) {
    rulesValidationFlags.push(hasMissingRuleset)
  }
  return rulesValidationFlags.some(Boolean) || !rule.payload
}

const renderRule = (rule: RouteRuleItem) => {
  const { type, payload, outbound, action, invert } = rule
  const children: string[] = [type]
  let _payload = payload
  if (type === RouteRuleType.RuleSet) {
    _payload = rule.payload
      .split(',')
      .map((id) => ruleSet.find((v) => v.id === id)?.tag || id)
      .join(',')
  } else if (type === RouteRuleType.Inbound) {
    _payload = inboundOptions.find((v) => v.value === rule.payload)?.label || rule.payload
  }
  if (invert) {
    _payload += ` (invert) `
  }
  children.push(_payload, action)
  if (outbound) {
    const proxy = outboundOptions.find((v) => v.value === outbound)?.label || outbound
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
      <div v-if="rule.type === RouteRuleType.InsertionPoint" class="text-center font-bold">
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
          <span
            v-if="hasLost(rule)"
            class="cursor-pointer"
            :style="{ color: 'rgb(200, 193, 11)' }"
            @click="showLost"
          >
            [ ! ]
          </span>
          {{ renderRule(rule) }}
        </div>
        <div class="ml-auto shrink-0">
          <Button
            v-if="rule.type === RouteRuleType.RuleSet && rule.payload && hasLost(rule)"
            type="text"
            @click="handleClearRuleset(rule)"
          >
            {{ t('common.clear') }}
          </Button>
          <Button icon="edit" type="text" size="small" @click="handleEdit(index)" />
          <Button icon="delete" type="text" size="small" @click="handleDelete(index)" />
        </div>
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    :on-ok="handleAddEnd"
    title="kernel.route.tab.rules"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.route.rules.type') }}
      <Select v-model="fields.type" :options="RouteRuleTypeOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.route.rules.action.name') }}
      <Radio v-model="fields.action" :options="RouteRuleActionOptions" class="ml-8" />
    </div>
    <div v-if="isSupportPayload" class="form-item">
      {{ t('kernel.route.rules.payload') }}
      <Radio
        v-if="fields.type === RouteRuleType.ClashMode"
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
        v-else-if="fields.type === RouteRuleType.Inbound"
        v-model="fields.payload"
        :options="inboundOptions"
      />
      <CodeEditor
        v-else-if="fields.type === RouteRuleType.Inline"
        v-model="fields.payload"
        editable
        lang="json"
        style="min-width: 320px"
      />
      <Switch
        v-else-if="fields.type === RouteRuleType.IpIsPrivate"
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
      <template v-if="fields.action === RouteActionKind.Route">
        <div class="form-item">
          {{ t('kernel.route.rules.outbound') }}
          <Select v-model="fields.outbound" :options="outboundOptions" clearable />
        </div>
      </template>
      <template v-else-if="fields.action === RouteActionKind.RouteOptions">
        <div class="form-item">
          {{ t('kernel.route.rules.routeOptions') }}
          <CodeEditor v-model="fields.outbound" editable lang="json" style="min-width: 320px" />
        </div>
      </template>
      <template v-else-if="fields.action === RouteActionKind.Reject">
        <div class="form-item">
          {{ t('kernel.route.rules.action.rejectMethod') }}
          <Radio v-model="fields.outbound" :options="RouteRejectMethodOptions" />
        </div>
      </template>
      <template v-else-if="fields.action === RouteActionKind.HijackDns">
        <Empty description="common.none" />
      </template>
      <template v-else-if="fields.action === RouteActionKind.Sniff">
        <div class="form-item">
          {{ t('kernel.route.rules.sniffer.name') }}
          <Select
            v-model="fields.sniffer"
            multiple
            clearable
            :options="SniffProtocolOptions"
            placeholder="All"
          />
        </div>
      </template>
      <template v-else-if="fields.action === RouteActionKind.Resolve">
        <div class="form-item">
          {{ t('kernel.strategy.name') }}
          <Select v-model="fields.strategy" :options="DomainStrategyOptions" />
        </div>
        <div class="form-item">
          {{ t('kernel.route.rules.server') }}
          <Select
            v-model="fields.server"
            :options="[{ label: 'kernel.strategy.byDnsRules', value: '' }, ...dnsServerOptions]"
          />
        </div>
      </template>
    </Card>
    <template v-if="fields.type === RouteRuleType.RuleSet">
      <Divider>{{ t('kernel.route.tab.rule_set') }}</Divider>
      <div class="grid grid-cols-3 gap-8">
        <Empty v-if="ruleSet.length === 0" :description="t('kernel.route.rule_set.empty')" />
        <template v-else>
          <Card
            v-for="ruleset in ruleSet"
            :key="ruleset.tag"
            v-tips="ruleset.type"
            :title="ruleset.tag"
            :selected="fields.payload.includes(ruleset.id)"
            class="ruleset"
            @click="handleUse(ruleset)"
          >
            <div class="text-12">
              {{ ruleset.type }}
              {{ ruleset.type === RuleSetType.Inline ? RuleSetFormat.Source : ruleset.format }}
            </div>
          </Card>
        </template>
      </div>
    </template>
  </Modal>
</template>

<style lang="less" scoped>
.rule-content {
  min-width: 0;
  word-break: break-all;
}
</style>
