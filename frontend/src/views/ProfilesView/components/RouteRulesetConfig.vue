<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  DraggableOptions,
  RuleSetFormatOptions,
  RuleSetTypeOptions,
  getDefaultRuleSet,
} from '@/constant'
import { RuleSetFormat, RuleSetType } from '@/enums'
import { useBool } from '@/hooks'
import { useRulesetsStore } from '@/stores'
import { deepClone, formatRecord, message, normalizeErrorMessage } from '@/utils'

import type { ComponentOption, Recordable, RuleSet, RuleSetProfile } from '@/types'

interface Props {
  httpClientOptions: ComponentOption[]
}

defineProps<Props>()

const model = defineModel<RuleSetProfile[]>({ required: true })

let rulesetId = 0
const fields = ref<RuleSetProfile>(getDefaultRuleSet(RuleSetType.Local))

const { t } = useI18n()
const [showEditModal] = useBool(false)
const rulesetsStore = useRulesetsStore()

const handleTypeChange = (newType: RuleSetType) => {
  const base = {
    id: fields.value.id,
  }

  fields.value = {
    ...getDefaultRuleSet(newType),
    ...base,
  }
}

const handleAdd = () => {
  rulesetId = -1
  fields.value = getDefaultRuleSet(RuleSetType.Local)
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleAddEnd = () => {
  if (fields.value.type === RuleSetType.Remote) {
    if (fields.value.tag.length > 1 && !fields.value.config.url.includes('{tag}')) {
      message.warn('kernel.route.rule_set.missingPlaceholder')
      return false
    }
  }
  if (rulesetId !== -1) {
    model.value[rulesetId] = fields.value
  } else {
    model.value.unshift(fields.value)
  }
  return true
}

const handleEdit = (index: number) => {
  rulesetId = index
  fields.value = deepClone(model.value[index]!)
  showEditModal.value = true
}

const handleDelete = (index: number) => {
  model.value.splice(index, 1)
}

const showLost = () => message.warn('kernel.route.rule_set.notFound')

const hasLost = (ruleset: RuleSetProfile) => {
  if (ruleset.type !== RuleSetType.Local) return false
  return !rulesetsStore.getRulesetById(ruleset.config.path)
}

const handleUse = (ruleset: RuleSet) => {
  if (fields.value.type !== RuleSetType.Local) return
  fields.value.config.path = ruleset.id
  fields.value.tag = ruleset.name
  fields.value.config.format = ruleset.format
}

const getRulesetFormat = (ruleset: RuleSetProfile): string => {
  if (ruleset.type === RuleSetType.Inline) {
    return RuleSetFormat.Source
  }
  return ruleset.config.format
}

const renderRules = (rules: string) => {
  try {
    const parsed = JSON.parse(rules) as Recordable[]
    return parsed.map(formatRecord).join(' | ')
  } catch (error) {
    return normalizeErrorMessage(error)
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
    <Card v-for="(ruleset, index) in model" :key="ruleset.id" class="mb-2">
      <div class="flex items-center py-2">
        <div class="font-bold min-w-0">
          <span
            v-if="hasLost(ruleset)"
            class="cursor-pointer"
            :style="{ color: 'rgb(200, 193, 11)' }"
            @click="showLost"
          >
            [ ! ]
          </span>

          <div class="flex items-center gap-8">
            <div class="shrink-0">
              <Tag>
                {{ t(`kernel.route.rule_set.type.${ruleset.type}`) }}
              </Tag>
              <Tag color="green">
                {{ t(`kernel.route.rule_set.format.${getRulesetFormat(ruleset)}`) }}
              </Tag>
              <Tag color="cyan">
                {{ Array.isArray(ruleset.tag) ? ruleset.tag.join(',') : ruleset.tag }}
              </Tag>
            </div>
            <div
              v-if="ruleset.type === RuleSetType.Inline"
              style="
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
              "
              :title="ruleset.config.rules"
            >
              {{ renderRules(ruleset.config.rules) }}
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
    title="kernel.route.tab.rule_set"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.route.rule_set.type.title') }}
      <Select
        v-model="fields.type"
        :options="RuleSetTypeOptions"
        @update:model-value="handleTypeChange"
      />
    </div>

    <div class="form-item">
      {{ t('kernel.route.rule_set.tag') }}
      <Input v-if="fields.type !== RuleSetType.Remote" v-model="fields.tag" autofocus />
      <InputList v-else v-model="fields.tag" />
    </div>
    <template v-if="fields.type === RuleSetType.Local">
      <Divider>{{ t('kernel.route.tab.rule_set') }}</Divider>
      <div class="grid grid-cols-3 gap-8">
        <Empty
          v-if="rulesetsStore.rulesets.length === 0"
          :description="t('kernel.route.rule_set.empty')"
        />
        <template v-else>
          <Card
            v-for="ruleset in rulesetsStore.rulesets"
            :key="ruleset.id"
            v-tips="ruleset.path"
            :title="ruleset.name"
            :selected="fields.config.path === ruleset.id"
            @click="handleUse(ruleset)"
          >
            <div class="text-12">
              {{ ruleset.path }}
            </div>
          </Card>
        </template>
      </div>
    </template>
    <template v-else-if="fields.type === RuleSetType.Remote">
      <div class="form-item">
        {{ t('kernel.route.rule_set.format.title') }}
        <Radio v-model="fields.config.format" :options="RuleSetFormatOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rule_set.url') }}
        <Input v-model="fields.config.url" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rule_set.http_client.title') }}
        <Select
          v-model="fields.config.http_client"
          :options="httpClientOptions"
          :placeholder="t('kernel.route.rule_set.http_client.default')"
          clearable
        />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rule_set.update_interval') }}
        <Input v-model="fields.config.update_interval" editable />
      </div>
    </template>
    <template v-else>
      <CodeEditor v-model="fields.config.rules" lang="json" editable />
    </template>
  </Modal>
</template>
