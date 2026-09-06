<script setup lang="ts">
import { OutboundType } from '@profile/constant/kernel'
import { OutboundOptions } from '@profile/constant/options'
import type { OutboundItem } from '@profile/types/profiles/outbound'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { BuiltInOutbound } from '@/constant/kernel'
import { useSubscribesStore } from '@/stores/subscribes'

interface Props {
  outbounds: OutboundItem[]
}

const outbound = defineModel<OutboundItem>({ required: true })

const { outbounds } = defineProps<Props>()

const { t } = useI18n()
const subscribesStore = useSubscribesStore()
const expandedSet = ref<Set<string>>(new Set(['Built-in', 'Subscription']))

const isGroupType = computed(
  () =>
    outbound.value.type === OutboundType.Selector || outbound.value.type === OutboundType.UrlTest,
)

const outboundGroups = computed(() => [
  {
    id: 'Built-in',
    name: 'kernel.outbounds.builtIn',
    proxies: [
      ...BuiltInOutbound.map((v) => ({ id: v, tag: v, type: 'Built-In' })),
      ...outbounds.map(({ id, tag, type }) => ({ id, tag, type: String(type) })),
    ],
  },
  {
    id: 'Subscription',
    name: 'kernel.outbounds.subscriptions',
    proxies: subscribesStore.subscribes.map(({ id, name }) => ({
      id,
      tag: name,
      type: 'Subscribe',
    })),
  },
  ...subscribesStore.subscribes.map(({ id, name, proxies }) => ({ id, name, proxies })),
])

const handleAddProxy = (groupID: string, proxyID: string, proxyName: string) => {
  if (groupID === 'Built-in' && proxyID === outbound.value.id) {
    return
  }

  const idx = outbound.value.outbounds.findIndex((item) => item.id === proxyID)
  if (idx !== -1) {
    outbound.value.outbounds.splice(idx, 1)
  } else {
    outbound.value.outbounds.push({ id: proxyID, tag: proxyName, type: groupID })
  }
}

const isInuse = (proxyID: string) => outbound.value.outbounds.some((item) => item.id === proxyID)

const toggleExpanded = (key: string) => {
  if (expandedSet.value.has(key)) {
    expandedSet.value.delete(key)
  } else {
    expandedSet.value.add(key)
  }
}

const isExpanded = (key: string) => expandedSet.value.has(key)
</script>

<template>
  <div class="form-item">
    {{ t('kernel.outbounds.tag') }}
    <Input v-model="outbound.tag" autofocus />
  </div>

  <div class="form-item">
    {{ t('kernel.outbounds.type') }}
    <Radio v-model="outbound.type" :options="OutboundOptions" />
  </div>

  <template v-if="isGroupType">
    <div class="form-item">
      {{ t('kernel.outbounds.hidden') }}
      <Switch v-model="outbound.hidden" />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.include') }}
      <Input v-model="outbound.include" placeholder="keywords1|keywords2" />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.exclude') }}
      <Input v-model="outbound.exclude" placeholder="keywords1|keywords2" />
    </div>
    <div class="form-item">
      <div class="flex items-center gap-8">
        {{ t('kernel.outbounds.icon') }}
        <img v-if="outbound.icon" :src="outbound.icon" class="w-18 h-18" />
      </div>
      <Input v-model="outbound.icon" clearable placeholder="https://" />
    </div>
  </template>

  <template v-if="!isGroupType">
    <Empty :description="t('kernel.outbounds.directDesc')" />
  </template>

  <template v-else-if="outbound.type === OutboundType.UrlTest">
    <div class="form-item">
      {{ t('kernel.outbounds.url') }}
      <Input v-model="outbound.url" placeholder="http(s)://" />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.interval') }}
      <Input v-model="outbound.interval" placeholder="3m" />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.tolerance') }}
      <Input v-model="outbound.tolerance" type="number" />
    </div>
  </template>

  <template v-if="isGroupType">
    <Divider>
      {{ t('kernel.outbounds.refsOutbound') }} & {{ t('kernel.outbounds.refsSubscription') }}
    </Divider>

    <div v-for="group in outboundGroups" :key="group.id" class="group">
      <Button
        :type="isExpanded(group.id) ? 'link' : 'text'"
        class="sticky top-0 backdrop-blur-sm w-full"
        @click="toggleExpanded(group.id)"
      >
        {{ t(group.name) }}
        <div class="ml-auto mr-8">{{ group.proxies.length }}</div>
        <Icon
          :class="{ 'rotate-z': isExpanded(group.id) }"
          icon="arrowRight"
          class="action-expand"
        />
      </Button>

      <div v-show="isExpanded(group.id)">
        <Empty
          v-if="group.proxies.length === 0"
          :description="
            group.id === 'Subscription' ? t('kernel.outbounds.noSubs') : t('kernel.outbounds.empty')
          "
        />
        <div v-else class="w-full grid grid-cols-4 gap-8 p-8">
          <Button
            v-for="proxy in group.proxies"
            :key="proxy.id"
            :type="isInuse(proxy.id) ? 'link' : 'text'"
            @click="handleAddProxy(group.id, proxy.id, proxy.tag)"
          >
            {{ proxy.tag }}
            <br />
            {{ proxy.type }}
          </Button>
        </div>
      </div>
    </div>
  </template>
</template>

<style lang="less" scoped>
.action-expand {
  transition: all 0.2s;
}
.rotate-z {
  transform: rotateZ(90deg);
}
</style>
