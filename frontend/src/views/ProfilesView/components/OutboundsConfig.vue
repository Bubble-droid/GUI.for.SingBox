<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions, getDefaultOutbound, OutboundOptions } from '@/constant'
import { Outbound, OutboundMember } from '@/enums'
import { useSubscribesStore } from '@/stores'
import { deepClone, message } from '@/utils'

import type { OutboundProfile, EndpointProfile, Recordable, OutboundMemberProfile } from '@/types'

import DialerConfig from './Shared/DialerConfig.vue'

interface Props {
  endpoints: EndpointProfile[]
  outboundOptions: { label: string; value: string }[]
  serverOptions: { label: string; value: string }[]
}

const props = defineProps<Props>()
const model = defineModel<OutboundProfile[]>({ required: true })

let updateGroupId = 0
const showEditModal = ref(false)
const showSortModal = ref(false)
const expandedSet = ref<Set<string>>(
  new Set([OutboundMember.BuiltIn, OutboundMember.Endpoint, OutboundMember.Subscription]),
)
const SubscribesNameMap = ref<Recordable<string>>({})

const subscribesStore = useSubscribesStore()
const { t } = useI18n()

subscribesStore.subscribes.forEach(({ id, name }) => {
  SubscribesNameMap.value[id] = name
})

const proxyGroup = computed(() => {
  const groups: Array<{
    id: string
    name: string
    proxies: Array<{ id: string; tag: string; type: string }>
  }> = [
    {
      id: OutboundMember.BuiltIn,
      name: 'kernel.outbounds.builtIn',
      proxies: model.value.map(({ id, tag, type }) => ({ id, tag, type: type })),
    },
    {
      id: OutboundMember.Endpoint,
      name: 'kernel.outbounds.endpoint',
      proxies: props.endpoints.map((v) => ({
        id: v.id,
        tag: v.tag,
        type: OutboundMember.Endpoint,
      })),
    },
    {
      id: OutboundMember.Subscription,
      name: 'kernel.outbounds.subscriptions',
      proxies: subscribesStore.subscribes.map((sub) => ({
        id: sub.id,
        tag: sub.name,
        type: OutboundMember.Subscription,
      })),
    },
  ]

  subscribesStore.subscribes.forEach(({ id, name, proxies }) => {
    groups.push({
      id,
      name,
      proxies: proxies.map((p) => ({ id: p.id, tag: p.tag, type: OutboundMember.Proxy })),
    })
  })

  return groups
})

const fields = ref<OutboundProfile>(getDefaultOutbound(Outbound.Selector))

const handleAdd = () => {
  updateGroupId = -1
  fields.value = getDefaultOutbound(Outbound.Selector)
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleDeleteGroup = (index: number) => {
  model.value.splice(index, 1)
}

const isGroupOutbound = (
  outbound: OutboundProfile,
): outbound is Extract<
  OutboundProfile,
  { type: typeof Outbound.Selector | typeof Outbound.Urltest }
> => {
  return outbound.type === Outbound.Selector || outbound.type === Outbound.Urltest
}

const handleClearGroup = (outbound: OutboundProfile) => {
  if (!isGroupOutbound(outbound)) return
  const validOutbounds = outbound.outbounds.filter((ref) => {
    if (ref.type === OutboundMember.BuiltIn) {
      return model.value.some((v) => v.id === ref.id)
    } else if (ref.type === OutboundMember.Endpoint) {
      return props.endpoints.some((v) => v.id === ref.id)
    } else if (ref.type === OutboundMember.Subscription) {
      return subscribesStore.getSubscribeById(ref.id)
    } else if (ref.type === OutboundMember.Proxy) {
      const sub = subscribesStore.getSubscribeById(ref.subId)
      return sub?.proxies.some((v) => v.id === ref.id)
    }
    return false
  })
  outbound.outbounds = validOutbounds
}

const handleAddEnd = () => {
  const { id, tag } = fields.value
  if (updateGroupId === -1) {
    model.value.unshift(fields.value)
    return
  }

  model.value[updateGroupId] = fields.value

  model.value
    .filter((outbound) => isGroupOutbound(outbound))
    .forEach((outbound) => {
      const proxy = outbound.outbounds.find((v) => v.id === id)
      if (proxy) proxy.tag = tag
    })
}

const handleEditGroup = (index: number) => {
  updateGroupId = index
  fields.value = deepClone(model.value[index]!)
  showEditModal.value = true
}

const handleAddProxy = (groupID: string, proxyID: string, proxyName: string) => {
  if (!isGroupOutbound(fields.value)) return
  if (groupID === OutboundMember.BuiltIn && proxyID === fields.value.id) return

  const idx = fields.value.outbounds.findIndex((outbound) => outbound.id === proxyID)
  if (idx !== -1) {
    fields.value.outbounds.splice(idx, 1)
  } else {
    let newMember: OutboundMemberProfile
    if (groupID === OutboundMember.BuiltIn) {
      newMember = {
        id: proxyID,
        tag: proxyName,
        type: OutboundMember.BuiltIn,
      }
    } else if (groupID === OutboundMember.Endpoint) {
      newMember = { id: proxyID, tag: proxyName, type: OutboundMember.Endpoint }
    } else if (groupID === OutboundMember.Subscription) {
      newMember = { id: proxyID, tag: proxyName, type: OutboundMember.Subscription }
    } else {
      newMember = {
        id: proxyID,
        subId: groupID,
        tag: proxyName,
        type: OutboundMember.Proxy,
      }
    }
    fields.value.outbounds.push(newMember)
  }
}

const isInuse = (_groupID: string, proxyID: string) => {
  if (!isGroupOutbound(fields.value)) return false
  return fields.value.outbounds.some((outbound) => outbound.id === proxyID)
}

const hasLost = (outbound: OutboundProfile) => {
  if (!isGroupOutbound(outbound)) return false
  return outbound.outbounds.some((ref) => {
    if (ref.type === OutboundMember.BuiltIn) {
      return model.value.every((v) => v.id !== ref.id)
    } else if (ref.type === OutboundMember.Endpoint) {
      return props.endpoints.every((v) => v.id !== ref.id)
    } else if (ref.type === OutboundMember.Subscription) {
      return !subscribesStore.getSubscribeById(ref.id)
    } else if (ref.type === OutboundMember.Proxy) {
      const sub = subscribesStore.getSubscribeById(ref.subId)
      return !sub || sub.proxies.every((v) => v.id !== ref.id)
    }
    return false
  })
}

const handleSortGroup = (index: number) => {
  updateGroupId = index
  fields.value = deepClone(model.value[index]!)
  showSortModal.value = true
}

const handleSortGroupEnd = () => {
  model.value[updateGroupId] = fields.value
}

const clacSubscriptionsCount = (outbound: OutboundProfile) => {
  if (!isGroupOutbound(outbound)) return 0
  return outbound.outbounds.filter((v) => v.type === OutboundMember.Subscription).length
}

const clacOutboundsCount = (outbound: OutboundProfile) => {
  if (!isGroupOutbound(outbound)) return 0
  return outbound.outbounds.filter((v) => v.type !== OutboundMember.Subscription).length
}

const needToAdd = (outbound: OutboundProfile) => {
  if (!isGroupOutbound(outbound)) return false
  return outbound.outbounds.length === 0
}

const toggleExpanded = (key: string) => {
  if (expandedSet.value.has(key)) {
    expandedSet.value.delete(key)
  } else {
    expandedSet.value.add(key)
  }
}

const isExpanded = (key: string) => expandedSet.value.has(key)

const showLost = () => message.warn('kernel.outbounds.notFound')
const showNeedToAdd = () => message.error('kernel.outbounds.needToAdd')

const onTypeChange = (newType: Outbound) => {
  const base = { id: fields.value.id }
  fields.value = { ...getDefaultOutbound(newType), ...base }
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
    <Card v-for="(outbound, index) in model" :key="outbound.id" class="mb-2">
      <div class="flex items-center py-2">
        <div class="font-bold flex items-center" style="min-width: 90px">
          <img
            v-if="isGroupOutbound(outbound) && outbound.icon"
            :src="outbound.icon"
            class="w-18 h-18 mr-4"
          />
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
        <Button
          v-if="isGroupOutbound(outbound)"
          type="link"
          size="small"
          @click="handleSortGroup(index)"
        >
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

  <Modal
    v-model:open="showSortModal"
    :on-ok="handleSortGroupEnd"
    mask-closable
    title="kernel.outbounds.sort"
    max-width="80"
    max-height="80"
  >
    <Divider>{{ t('kernel.outbounds.refs') }}</Divider>
    <Empty v-if="!isGroupOutbound(fields) || fields.outbounds.length === 0" />
    <div v-if="isGroupOutbound(fields)" v-draggable="[fields.outbounds, DraggableOptions]">
      <Button v-for="proxy in fields.outbounds" :key="proxy.id" type="link">
        {{ proxy.tag }}
      </Button>
    </div>
  </Modal>

  <Modal
    v-model:open="showEditModal"
    :on-ok="handleAddEnd"
    title="kernel.outbounds.title"
    width="80"
    height="80"
  >
    <div class="form-item">
      {{ t('kernel.outbounds.type.title') }}
      <Select
        :model-value="fields.type"
        :options="OutboundOptions"
        @update:model-value="onTypeChange"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.tag') }}
      <Input v-model="fields.tag" autofocus />
    </div>
    <template v-if="fields.type === Outbound.Direct">
      <DialerConfig
        v-model="fields.config.dialer"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
      />
    </template>
    <template v-if="fields.type === Outbound.Bridge">
      <div class="form-item">
        {{ t('kernel.outbounds.bridge.interface') }}
        <InterfaceSelect v-model="fields.config.interface" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.bridge.bridge_name.title') }}
        <Input
          v-model="fields.config.bridge_name"
          :placeholder="t('kernel.outbounds.bridge.bridge_name.default')"
          editable
          clearable
        />
      </div>
    </template>
    <template v-if="isGroupOutbound(fields)">
      <div class="form-item">
        {{ t('kernel.outbounds.hidden') }}
        <Switch v-model="fields.hidden" />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.include') }}
        <Input v-model="fields.include" placeholder="keywords1|keywords2" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.exclude') }}
        <Input v-model="fields.exclude" placeholder="keywords1|keywords2" editable clearable />
      </div>
      <div class="form-item">
        <div class="flex items-center gap-8">
          {{ t('kernel.outbounds.icon') }}
          <img v-if="fields.icon" :src="fields.icon" class="w-18 h-18" />
        </div>
        <Input v-model="fields.icon" clearable placeholder="https://" editable />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.group.interrupt_exist_connections') }}
        <Switch v-model="fields.config.interrupt_exist_connections" />
      </div>
    </template>

    <template v-if="fields.type === Outbound.Urltest">
      <div class="form-item">
        {{ t('kernel.outbounds.group.url') }}
        <Input v-model="fields.config.url" placeholder="http(s)://" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.group.interval') }}
        <Input v-model="fields.config.interval" placeholder="3m" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.group.tolerance') }}
        <Input v-model="fields.config.tolerance" type="number" editable clearable />
      </div>
    </template>

    <template v-if="isGroupOutbound(fields)">
      <Divider
        >{{ t('kernel.outbounds.refsOutbound') }} &
        {{ t('kernel.outbounds.refsSubscription') }}</Divider
      >
      <div v-for="group in proxyGroup" :key="group.id" class="group">
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
              group.id === 'Subscription'
                ? t('kernel.outbounds.noSubs')
                : t('kernel.outbounds.empty')
            "
          />
          <template v-else>
            <div class="w-full grid grid-cols-4 gap-8 p-8">
              <Button
                v-for="proxy in group.proxies"
                :key="proxy.id"
                :type="isInuse(group.id, proxy.id) ? 'link' : 'text'"
                @click="handleAddProxy(group.id, proxy.id, proxy.tag)"
              >
                {{ proxy.tag }}
                <br />
                {{ proxy.type }}
              </Button>
            </div>
          </template>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style lang="less" scoped>
.action-expand {
  transition: all 0.2s;
}
.rotate-z {
  transform: rotateZ(90deg);
}
</style>
