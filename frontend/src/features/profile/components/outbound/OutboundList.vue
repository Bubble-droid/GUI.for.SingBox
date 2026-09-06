<script lang="ts" setup>
import { OutboundType } from '@profile/constant/kernel'
import { createOutbound } from '@profile/defaults/outbound'
import type { OutboundItem } from '@profile/types/profiles/outbound'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { BuiltInOutbound } from '@/constant/kernel'
import { useSubscribesStore } from '@/stores/subscribes'
import { message, modal } from '@/utils/interaction'
import { deepClone } from '@/utils/others'

import OutboundForm from './OutboundForm.vue'
import OutboundSort from './OutboundSort.vue'

const model = defineModel<OutboundItem[]>({ required: true })

const { t } = useI18n()
const subscribesStore = useSubscribesStore()

const isGroupType = (type: string): boolean =>
  type === OutboundType.Selector || type === OutboundType.UrlTest

const handleAdd = () => openOutboundModal(createOutbound(), -1)

const handleDeleteGroup = (index: number) => {
  model.value.splice(index, 1)
}

const handleClearGroup = (outbound: OutboundItem) => {
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

const openOutboundModal = (outbound: OutboundItem, index: number) => {
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
        .filter((item) => isGroupType(item.type))
        .forEach(({ outbounds }) => {
          const reference = outbounds.find((item) => item.id === id)
          if (reference) {
            reference.tag = tag
          }
        })
    },
  })

  m.setContent(OutboundForm, { modelValue: draft.value, outbounds: model.value }).open()
}

const handleEditGroup = (index: number) => openOutboundModal(model.value[index]!, index)

const hasLost = (outbound: OutboundItem): boolean => {
  if (!isGroupType(outbound.type)) {
    return false
  }

  return outbound.outbounds.some(({ id, type }) => {
    if (type === 'Built-in') {
      if ((BuiltInOutbound as string[]).includes(id)) {
        return false
      }
      return model.value.every((v) => v.id !== id)
    } else if (type === 'Subscription') {
      return !subscribesStore.getSubscribeById(id)
    }
    const sub = subscribesStore.getSubscribeById(type)
    if (!sub) {
      return true
    }
    return sub.proxies.every((v) => v.id !== id)
  })
}

const handleSortGroup = (index: number) => {
  const draft = ref(deepClone(model.value[index]!))
  const m = modal({
    title: 'kernel.outbounds.sort',
    maxWidth: '80',
    maxHeight: '80',
    maskClosable: true,
    onOk: () => {
      model.value[index] = draft.value
    },
  })
  m.setContent(OutboundSort, { modelValue: draft.value }).open()
}

const calcSubscriptionsCount = (outbound: OutboundItem): number => {
  if (!isGroupType(outbound.type)) {
    return 0
  }
  return outbound.outbounds.filter((v) => v.type === 'Subscription').length
}

const calcOutboundsCount = (outbound: OutboundItem): number => {
  if (!isGroupType(outbound.type)) {
    return 0
  }
  return outbound.outbounds.filter((v) => v.type !== 'Subscription').length
}

const needToAdd = (outbound: OutboundItem): boolean => {
  if (isGroupType(outbound.type)) {
    return outbound.outbounds.length === 0
  }
  return false
}

const showLost = () => message.warn('kernel.outbounds.notFound')
const showNeedToAdd = () => message.error('kernel.outbounds.needToAdd')

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
          {{ t('kernel.outbounds.refsOutbound') }}:{{ calcOutboundsCount(outbound) }}
          /
          {{ t('kernel.outbounds.refsSubscription') }}:{{ calcSubscriptionsCount(outbound) }}
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
