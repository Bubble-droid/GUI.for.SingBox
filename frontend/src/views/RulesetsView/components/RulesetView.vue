<script setup lang="ts">
import { useModalContext } from '@components/Modal'
import { ref, h, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { WriteFile, ReadFile } from '@/bridge/io'

import { useRulesetsStore } from '@/stores/rulesets'
import { message } from '@/utils/interaction'
import { isValidJson } from '@/utils/is'
import { deepClone, ignoredError } from '@/utils/others'

import Button from '@/components/Button/index.vue'

import type { AppRuleSet } from '@/types/app'

interface Props {
  id: string
}

const { id } = defineProps<Props>()

const { cancel, submit } = useModalContext()

const loading = ref(false)
const ruleset = ref<AppRuleSet>()
const rulesetContent = ref<string>('')

const { t } = useI18n()
const rulesetsStore = useRulesetsStore()

const handleSave = async () => {
  if (!ruleset.value) {
    return
  }
  loading.value = true
  try {
    if (!isValidJson(rulesetContent.value)) {
      throw 'syntax error'
    }
    await WriteFile(ruleset.value.path, rulesetContent.value)
    await rulesetsStore.updateRuleset(ruleset.value.id)
    await submit()
  } catch (error: any) {
    message.error(error)
    console.log(error)
  } finally {
    loading.value = false
  }
}

const initContent = async () => {
  const r = rulesetsStore.getRulesetById(id)
  if (r) {
    ruleset.value = deepClone(r)
    const content = (await ignoredError(ReadFile, r.path)) || ''
    rulesetContent.value = content
  }
}

onMounted(async () => {
  await initContent()
})

const modalSlots = {
  cancel: () =>
    h(
      Button,
      {
        disabled: loading.value,
        onClick: cancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        loading: loading.value,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
} as const

defineExpose({ modalSlots })
</script>

<template>
  <CodeEditor v-model="rulesetContent" lang="json" editable class="h-full" />
</template>
