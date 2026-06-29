<script lang="ts" setup>
import { computed, ref } from 'vue'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  RuleTypeOptions,
  RouteRuleActionOptions,
  RouteRuleTypeOptions,
  RouteRejectMethodOptions,
  SniffProtocolOptions,
  LogicalModeOptions,
  getDefaultRouteRule,
  DraggableOptions,
} from '@/constant'
import { RuleType, RouteRuleAction, RouteRuleType } from '@/enums'
import { useBool } from '@/hooks'
import {
  deepClone,
  extractProps,
  formatRecord,
  generateRouteRules,
  generateRuleConditions,
  message,
} from '@/utils'

import type { RouteRuleProfile, RouteRuleItem, ComponentOption, Recordable } from '@/types'

import DomainResolverConfig from './Shared/DomainResolverConfig.vue'
import RouteOptionsConfig from './Shared/RouteOptionsConfig.vue'
import RuleConditionList from './Shared/RuleConditionList.vue'

interface Props {
  inboundOptions: ComponentOption[]
  outboundOptions: ComponentOption[]
  serverOptions: ComponentOption[]
  ruleSetOptions: ComponentOption[]
}

interface TagMaps {
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  ruleSets: Map<string, string>
  dnsServers: Map<string, string>
}

const props = defineProps<Props>()
const model = defineModel<RouteRuleProfile[]>({ required: true })
const { t } = useI18n()
const [showEditModal] = useBool(false)

let ruleId = -1
const fields = ref<RouteRuleProfile>(getDefaultRouteRule(RuleType.Default, RouteRuleAction.Route))

const handleAdd = () => {
  ruleId = -1
  fields.value = getDefaultRouteRule(RuleType.Default, RouteRuleAction.Route)
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleAddEnd = () => {
  if (ruleId !== -1) {
    model.value[ruleId] = fields.value
  } else {
    model.value.unshift(fields.value)
  }
}

const handleEdit = (index: number) => {
  ruleId = index
  fields.value = deepClone(model.value[index]!)
  showEditModal.value = true
}

const handleDelete = (index: number) => {
  model.value.splice(index, 1)
}

const onTypeChange = (newType: RuleType) => {
  const baseAction = fields.value.action
  fields.value = {
    ...getDefaultRouteRule(newType, baseAction),
    id: fields.value.id,
    enable: fields.value.enable,
  } as RouteRuleProfile
}

const onActionChange = (newAction: RouteRuleAction) => {
  const baseType = fields.value.type
  fields.value = {
    ...getDefaultRouteRule(baseType, newAction),
    id: fields.value.id,
    enable: fields.value.enable,
    ruleConditions: fields.value.ruleConditions,
  } as RouteRuleProfile
}

const addLogicalBlock = () => {
  if (fields.value.type === RuleType.Logical) {
    fields.value.ruleConditions.rules.push({ conditions: [] })
  }
}

const removeLogicalBlock = (index: number) => {
  if (fields.value.type === RuleType.Logical) {
    fields.value.ruleConditions.rules.splice(index, 1)
  }
}

const checkConditionsInvalid = (conditions: RouteRuleItem[]) => {
  return conditions.some((cond) => {
    if (cond.type === RouteRuleType.Inbound) {
      return cond.value.some((v) => !props.inboundOptions.some((o) => o.value === v))
    }
    if (cond.type === RouteRuleType.RuleSet) {
      return cond.value.some((v) => !props.ruleSetOptions.some((o) => o.value === v))
    }
    return false
  })
}

const isRuleInvalid = (rule: RouteRuleProfile) => {
  let invalid = false

  if (rule.type === RuleType.Default) {
    invalid = checkConditionsInvalid(rule.ruleConditions)
  } else if (rule.type === RuleType.Logical) {
    invalid = rule.ruleConditions.rules.some((block) => checkConditionsInvalid(block.conditions))
  }

  if (rule.action === RouteRuleAction.Route || rule.action === RouteRuleAction.Bypass) {
    if (!props.outboundOptions.find((o) => o.value === rule.actionParams.outbound)) {
      invalid = true
    }
  } else if (rule.action === RouteRuleAction.Resolve) {
    if (!props.serverOptions.find((o) => o.value === rule.actionParams.server)) {
      invalid = true
    }
  }
  return invalid
}

const showInvalidWarning = () => message.warn('kernel.rules.invalid')

const buildIdTagMapping = (options: ComponentOption[]): Map<string, string> => {
  return new Map(options.map((v) => [v.value, v.label]))
}

interface CachedResult {
  json: string
  actionText: string
  conditionsText: string
}

const maps = computed<TagMaps>(() => {
  return {
    inbounds: buildIdTagMapping(props.inboundOptions),
    outbounds: buildIdTagMapping(props.outboundOptions),
    ruleSets: buildIdTagMapping(props.ruleSetOptions),
    dnsServers: buildIdTagMapping(props.serverOptions),
  }
})

let ruleComputeCache = new WeakMap<RouteRuleProfile, CachedResult>()

watch(
  maps,
  () => {
    ruleComputeCache = new WeakMap()
  },
  { deep: true },
)

const formattedRules = computed(() => {
  return model.value.map((rule: RouteRuleProfile) => {
    let cachedResult = ruleComputeCache.get(rule)
    if (!cachedResult) {
      let conditionsText = ''
      const conditions = generateRuleConditions(rule as any, maps.value as any)

      if (conditions.type === 'logical') {
        const subConditions = conditions.rules.map((sub) => formatRecord(sub))
        const separator = ` ${t(`kernel.rules.logical.mode.${conditions.mode}`)} `
        conditionsText = `(${subConditions.join(separator)})`
      } else {
        conditionsText = formatRecord(conditions)
      }

      const final = generateRouteRules([rule], maps.value as any)[0]! as Recordable
      const result = extractProps(final, conditions)
      const { action: _, ...cleanRest } = result.rest
      const actionText = formatRecord(cleanRest)

      cachedResult = {
        conditionsText,
        actionText,
        json: JSON.stringify(final, null, 2),
      }
      ruleComputeCache.set(rule, cachedResult)
    }

    return {
      ...rule,
      json: cachedResult.json,
      conditionsText: cachedResult.conditionsText,
      actionText: cachedResult.actionText,
    }
  })
})
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
    <Card v-for="(item, index) in formattedRules" :key="item.id" class="mb-2">
      <div class="flex items-center py-2 gap-8">
        <div class="shrink-0">
          <Switch v-model="model[index]!.enable" size="small" />
        </div>

        <span
          v-if="isRuleInvalid(model[index]!)"
          class="shrink-0"
          :style="{ color: 'rgb(200, 193, 11)' }"
          :title="t('kernel.outbounds.notFound')"
          @click="showInvalidWarning"
        >
          [ ! ]
        </span>

        <div class="font-bold min-w-0" :title="item.json">
          <div class="flex items-center">
            <div class="shrink-0" style="min-width: 180px">
              <Tag>
                {{ t('kernel.rules.condition.name') }}
              </Tag>
              <Tag color="cyan">
                {{ item.type }}
              </Tag>
            </div>

            <div
              style="
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
              "
            >
              {{ item.conditionsText }}
            </div>
          </div>
          <div class="flex items-center mt-8">
            <div class="shrink-0" style="min-width: 180px">
              <Tag>
                {{ t(`kernel.rules.action.name`) }}
              </Tag>
              <Tag color="cyan">
                {{ item.action }}
              </Tag>
            </div>

            <div
              style="
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
              "
            >
              {{ item.actionText }}
            </div>
          </div>
        </div>
        <div class="ml-auto shrink-0">
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
      {{ t('kernel.rules.type.title') }}
      <Select
        :model-value="fields.type"
        :options="RuleTypeOptions"
        @update:model-value="onTypeChange"
      />
    </div>

    <Divider>
      {{ t('kernel.rules.condition.title') }}
    </Divider>

    <template v-if="fields.type === RuleType.Default">
      <RuleConditionList
        v-model="fields.ruleConditions"
        :options="RouteRuleTypeOptions"
        :inbound-options="inboundOptions"
        :rule-set-options="ruleSetOptions"
        location="route"
      />
    </template>

    <template v-else-if="fields.type === RuleType.Logical">
      <div class="form-item">
        {{ t('kernel.rules.logical.mode.title') }}
        <Radio v-model="fields.ruleConditions.mode" :options="LogicalModeOptions" />
      </div>

      <Empty v-if="fields.ruleConditions.rules.length === 0" class="py-2" />
      <div class="flex flex-col gap-8 mt-8">
        <Card
          v-for="(ruleBlock, index) in fields.ruleConditions.rules"
          :key="index"
          :title="`${t('kernel.rules.logical.block')} ${index + 1}`"
        >
          <template #extra>
            <Button type="primary" @click="removeLogicalBlock(index)"
              >{{ t('kernel.rules.logical.remove') }}
            </Button>
          </template>
          <RuleConditionList
            v-model="ruleBlock.conditions"
            :options="RouteRuleTypeOptions"
            :inbound-options="inboundOptions"
            :rule-set-options="ruleSetOptions"
            location="route"
          />
        </Card>
      </div>
      <div class="flex items-center justify-center mt-8">
        <Button type="primary" @click="addLogicalBlock">{{ t('kernel.rules.logical.add') }}</Button>
      </div>
    </template>

    <template v-else-if="fields.type === RuleType.Inline">
      <CodeEditor v-model="fields.ruleConditions" lang="json" editable />
    </template>

    <Divider>{{ t('kernel.rules.action.title') }}</Divider>

    <div class="form-item">
      {{ t('kernel.rules.action.name') }}
      <Select
        :model-value="fields.action"
        :options="RouteRuleActionOptions"
        @update:model-value="onActionChange"
      />
    </div>

    <template
      v-if="fields.action === RouteRuleAction.Route || fields.action === RouteRuleAction.Bypass"
    >
      <div class="form-item">
        {{ t('kernel.rules.action.outbound') }}
        <Select v-model="fields.actionParams.outbound" :options="outboundOptions" clearable />
      </div>
      <RouteOptionsConfig v-model="fields.actionParams.options" />
    </template>
    <template v-else-if="fields.action === RouteRuleAction.RouteOptions">
      <RouteOptionsConfig v-model="fields.actionParams" />
    </template>
    <template v-else-if="fields.action === RouteRuleAction.Reject">
      <div class="form-item">
        {{ t('kernel.rules.action.reject.method.title') }}
        <Radio v-model="fields.actionParams.method" :options="RouteRejectMethodOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.rules.action.reject.no_drop') }}
        <Switch v-model="fields.actionParams.no_drop" />
      </div>
    </template>
    <template v-else-if="fields.action === RouteRuleAction.Resolve">
      <DomainResolverConfig v-model="fields.actionParams" :server-options="serverOptions" />
    </template>
    <template v-else-if="fields.action === RouteRuleAction.Sniff">
      <div class="form-item">
        {{ t('kernel.rules.action.sniff.sniffer.title') }}
        <Select
          v-model="fields.actionParams.sniffer"
          :options="SniffProtocolOptions"
          :placeholder="t('kernel.rules.action.sniff.sniffer.default')"
          multiple
          clearable
        />
      </div>
    </template>
  </Modal>
</template>
