<script lang="ts" setup>
import { createOutbound } from '@defaults/outbounds'
import { Outbound } from '@features/constant/kernel'
import type { OutboundConfig } from '@profiles/outbounds'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { BuiltInOutbound } from '@/constant/kernel'
import { useSubscribesStore } from '@/stores/subscribes'
import { message, modal } from '@/utils/interaction'
import { deepClone } from '@/utils/others'

import OutboundForm from './OutboundForm.vue'
import OutboundSort from './OutboundSort.vue'

const model = defineModel<OutboundConfig[]>({ required: true })

const { t } = useI18n()
const subscribesStore = useSubscribesStore()

const handleAdd = () => openOutboundModal(createOutbound(), -1)

defineExpose({ handleAdd })

const handleDeleteGroup = (index: number) => {
  model.value.splice(index, 1)
}

const handleClearGroup = (outbound: OutboundConfig) => {
  const filtered = outbound.outbounds.filter(({ id, type }) => {
    if (type === 'Built-in') {
      return model.value.some((v) => v.id === id)
    } else if (type === 'Subscription') {
      return subscribesStore.getSubscribeById(id)
    }
    const sub = subscribesStore.getSubscribeById(type)
    return sub?.proxies.some((v) => v.id === id)
  })
  outbound.outbounds.splice(0)
  outbound.outbounds.push(...filtered)
}

const openOutboundModal = (outbound: OutboundConfig, index: number) => {
  const draft = ref(deepClone(outbound))
  const m = modal({
    title: 'kernel.outbounds.name',
    width: '80',
    height: '80',
    onOk: () => {
      if (index === -1) {
        model.value.unshift(draft.value)
        return
      }

      model.value[index] = draft.value
      const { id, tag } = draft.value
      model.value
        .filter((item) => [Outbound.Selector, Outbound.UrlTest].includes(item.type as any))
        .forEach(({ outbounds }) => {
          const reference = outbounds.find((item) => item.id === id)
          reference && (reference.tag = tag)
        })
    },
  })
  m.setContent(OutboundForm, { outbound: draft.value, outbounds: model.value }).open()
}

const handleEditGroup = (index: number) => openOutboundModal(model.value[index]!, index)

const hasLost = (outbound: OutboundConfig) => {
  if ([Outbound.Selector, Outbound.UrlTest].includes(outbound.type as any)) {
    return outbound.outbounds.some(({ id, type }) => {
      if (type === 'Built-in') {
        if (BuiltInOutbound.includes(id as any)) {
          return false
        }
        return model.value.every((v) => v.id !== id)
      } else if (type === 'Subscription') {
        const sub = subscribesStore.getSubscribeById(id)
        if (!sub) {
          return true
        }
        return false
      }
      const sub = subscribesStore.getSubscribeById(type)
      if (!sub) {
        return true
      }
      return sub.proxies.every((v) => v.id !== id)
    })
  }
  return false
}

const handleSortGroup = (index: number) => {
  const outbound = ref(deepClone(model.value[index]!))
  const m = modal({
    title: 'kernel.outbounds.sort',
    maxWidth: '80',
    maxHeight: '80',
    maskClosable: true,
    onOk: () => {
      model.value[index] = outbound.value
    },
  })
  m.setContent(OutboundSort, { outbound: outbound.value }).open()
}

const clacSubscriptionsCount = (outbound: OutboundConfig) => {
  if ([Outbound.Selector, Outbound.UrlTest].includes(outbound.type as any)) {
    return outbound.outbounds.filter((v) => v.type === 'Subscription').length
  }
  return 0
}

const clacOutboundsCount = (outbound: OutboundConfig) => {
  if ([Outbound.Selector, Outbound.UrlTest].includes(outbound.type as any)) {
    return outbound.outbounds.filter((v) => v.type !== 'Subscription').length
  }
  return 0
}

const needToAdd = (outbound: OutboundConfig) => {
  if ([Outbound.Selector, Outbound.UrlTest].includes(outbound.type as any)) {
    return outbound.outbounds.length === 0
  }
  return false
}

const showLost = () => message.warn('kernel.outbounds.notFound')

const showNeedToAdd = () => message.error('kernel.outbounds.needToAdd')
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
    <Card v-for="(outbound, index) in model" :key="outbound.id" class="mb-2">
      <div class="flex items-center py-2">
        <div class="font-bold flex items-center" style="min-width: 90px">
          <img v-if="outbound.icon" :src="outbound.icon" class="w-18 h-18 mr-4" />
          <span
            v-if="hasLost(outbound)"
            class="cursor-pointer"
            style="color: rgb(200, 193, 11)"
            @click="showLost"
          >
            [ ! ]
          </span>
          <span
            v-if="needToAdd(outbound)"
            class="cursor-pointer"
            style="color: red"
            @click="showNeedToAdd"
          >
            [ ! ]
          </span>
          {{ outbound.tag }}
        </div>
        <Button type="link" size="small" @click="handleSortGroup(index)">
          (
          {{ t('kernel.outbounds.refsOutbound') }}:{{ clacOutboundsCount(outbound) }}
          /
          {{ t('kernel.outbounds.refsSubscription') }}:{{ clacSubscriptionsCount(outbound) }}
          )
        </Button>
        <div class="ml-auto">
          <Button v-if="hasLost(outbound)" type="text" @click="handleClearGroup(outbound)">
            {{ t('common.clear') }}
          </Button>
          <Button icon="edit" type="text" size="small" @click="handleEditGroup(index)" />
          <Button icon="delete" type="text" size="small" @click="handleDeleteGroup(index)" />
        </div>
      </div>
    </Card>
  </div>
</template>
