<script setup lang="ts" generic="K extends string">
import { computed, type Component, type VNodeChild } from 'vue'
import { useI18n } from 'vue-i18n'

interface TabItemType<K extends string = string> {
  key: K
  tab: string
  component?: Component
}

interface Props<K extends string = string> {
  activeKey: K
  items: readonly TabItemType<K>[]
  tabPosition?: 'left' | 'top'
  tabWidth?: string
  contentWidth?: string
}

type Slots<K extends string = string> = {
  extra?: () => VNodeChild
} & Partial<Record<K, () => VNodeChild>>

const props = withDefaults(defineProps<Props<K>>(), {
  tabPosition: 'left',
  tabWidth: '20%',
  contentWidth: '80%',
})

const emits = defineEmits<(e: 'update:activeKey', key: K) => void>()

const { t } = useI18n()
const slots = defineSlots<Slots<K>>()

const isTop = computed(() => props.tabPosition === 'top')

const handleChange = (key: K) => emits('update:activeKey', key)

const isActive = (tab: TabItemType<K>) => tab.key === props.activeKey

// NOTE:
// - component tabs are cached via KeepAlive
// - slot tabs are rendered as functional components and NOT cached
const currentComponent = computed(() => {
  const comp = props.items.find((i) => i.key === props.activeKey)?.component
  return comp ?? slots[props.activeKey]
})
</script>

<template>
  <div :class="{ 'flex-col': isTop }" class="gui-tabs flex">
    <div
      :class="{ 'justify-center mb-8': isTop, 'flex-col': !isTop }"
      :style="{ width: isTop ? 'auto' : tabWidth }"
      class="gui-tabs-tab flex"
    >
      <Button
        v-for="tab in items"
        :key="tab.key"
        :type="isActive(tab) ? 'link' : 'text'"
        @click="handleChange(tab.key)"
      >
        {{ t(tab.tab) }}
      </Button>
      <slot name="extra"></slot>
    </div>

    <div class="flex flex-col" :style="{ width: isTop ? 'auto' : contentWidth }">
      <ScrollView :pt="0" :pr="24" :pb="8" :pl="8">
        <KeepAlive>
          <component :is="currentComponent" />
        </KeepAlive>
      </ScrollView>
    </div>
  </div>
</template>
