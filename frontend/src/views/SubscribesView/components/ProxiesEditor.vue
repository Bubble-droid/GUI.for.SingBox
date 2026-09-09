<script setup lang="ts">
import { useModalContext } from '@components/Modal'
import { ref, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { WriteFile, ReadFile } from '@/bridge/io'

import { useSubscribesStore } from '@/stores/subscribes'
import { message } from '@/utils/interaction'
import { deepClone, sampleID, omitArray, ignoredError } from '@/utils/others'

import Button from '@/components/Button/index.vue'

import type * as App from '@/types/app'

interface Props {
  sub: App.Subscription
}

const { sub } = defineProps<Props>()

const { cancel, submit } = useModalContext()

const loading = ref(false)
const proxiesText = ref('')
const subRef = ref(deepClone(sub))

const { t } = useI18n()
const subscribeStore = useSubscribesStore()

const handleSave = async () => {
  loading.value = true
  try {
    const { path, proxies, id } = subRef.value
    const proxiesWithId: Record<string, any>[] = JSON.parse(proxiesText.value)
    subRef.value.proxies = proxiesWithId.map((v) => ({
      id: proxies.find((proxy) => proxy.id === v['__id_in_gui'])?.id || sampleID(),
      tag: v['tag'],
      type: v['type'],
    }))
    await WriteFile(path, JSON.stringify(omitArray(proxiesWithId, ['__id_in_gui']), null, 2))
    await subscribeStore.editSubscribe(id, subRef.value)
    await submit()
  } catch (error: any) {
    console.log(error)

    message.error(error.message || error)
  }
  loading.value = false
}

const initProxiesText = async () => {
  const content = (await ignoredError(ReadFile, subRef.value.path)) || '[]'
  const proxies: App.Subscription['proxies'] = JSON.parse(content)
  const proxiesWithId = proxies.map((proxy) => {
    return {
      __id_in_gui: subRef.value.proxies.find((v) => v.tag === proxy.tag)?.id || sampleID(),
      ...proxy,
    }
  })
  proxiesText.value = JSON.stringify(proxiesWithId, null, 2)
}

initProxiesText()

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
}

defineExpose({ modalSlots })
</script>

<template>
  <CodeEditor v-model="proxiesText" lang="json" editable class="h-full" />
</template>
