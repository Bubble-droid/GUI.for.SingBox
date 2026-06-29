<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks'

interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'kernel.fields',
})

const model = defineModel<string>({ required: true })
const { t } = useI18n()

const [showFields, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">
      {{ t(title) }}
    </Button>
  </Divider>
  <div v-show="showFields">
    <CodeEditor v-model="model" editable lang="json" />
  </div>
</template>
