<script setup lang="ts">
import type { OutboundChild, OutboundItem } from '@profile/types/profiles/outbounds'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { useSubscribesStore } from '@/stores/subscribes'

interface Props {
  outbound: OutboundItem
}

defineProps<Props>()

const { t } = useI18n()
const subscribesStore = useSubscribesStore()

const getOutboundName = (item: OutboundChild) => {
  if (item.type === 'Subscription') {
    return subscribesStore.getSubscribeById(item.id)?.name || item.tag
  }
  return item.tag
}
</script>

<template>
  <Divider>{{ t('kernel.outbounds.refs') }}</Divider>
  <Empty v-if="outbound.outbounds.length === 0" />
  <div v-draggable="[outbound.outbounds, DraggableOptions]">
    <Button v-for="item in outbound.outbounds" :key="item.id" type="link">
      {{ getOutboundName(item) }}
    </Button>
  </div>
</template>
