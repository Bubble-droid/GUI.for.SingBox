<script lang="ts" setup generic="T extends ResourceType">
import { computed, nextTick, onMounted } from 'vue'
import type { SetupContext, Slot } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePluginsStore } from '@/stores/plugins'
import { useProfilesStore } from '@/stores/profiles'
import { useRulesetsStore } from '@/stores/rulesets'
import { useScheduledTasksStore } from '@/stores/scheduledtasks'
import { useSubscribesStore } from '@/stores/subscribes'
import { modal, message } from '@/utils/interaction'

import type { ResourceItemMap, ResourceSelectProps, ResourceType } from './types'

interface ResourceConfig<K extends ResourceType> {
  title: string
  list: ResourceItemMap<K>[]
  getById: (id: string) => ResourceItemMap<K> | undefined
  getName: (item: ResourceItemMap<K>) => string
  getDescription: (item: ResourceItemMap<K>) => string
}

type ResourceConfigMap = { [K in ResourceType]: ResourceConfig<K> }

const props = withDefaults(defineProps<ResourceSelectProps<T>>(), {
  title: undefined,
  cols: 3,
  min: 0,
  max: Number.MAX_SAFE_INTEGER,
  renderSlot: true,
  openImmediate: false,
})

const model = defineModel<string[]>({ default: () => [] })

const emit = defineEmits<{
  change: [val: string[], items: ResourceItemMap<T>[]]
  submit: [val: string[], items: ResourceItemMap<T>[]]
}>()

const { t } = useI18n()
const profilesStore = useProfilesStore()
const subscribesStore = useSubscribesStore()
const rulesetsStore = useRulesetsStore()
const pluginsStore = usePluginsStore()
const scheduledTasksStore = useScheduledTasksStore()

const resourceConfig = computed<ResourceConfig<T>>(() => {
  const configs: ResourceConfigMap = {
    profile: {
      title: 'profiles.select',
      list: profilesStore.profiles,
      getById: profilesStore.getProfileById,
      getName: (item) => item.name,
      getDescription: () => '',
    },
    subscription: {
      title: 'subscribes.select',
      list: subscribesStore.subscribes,
      getById: subscribesStore.getSubscribeById,
      getName: (item) => item.name,
      getDescription: (item) => item.type,
    },
    ruleset: {
      title: 'rulesets.select',
      list: rulesetsStore.rulesets,
      getById: rulesetsStore.getRulesetById,
      getName: (item) => item.name,
      getDescription: (item) => `${item.type} / ${item.format}`,
    },
    plugin: {
      title: 'plugins.select',
      list: pluginsStore.plugins,
      getById: pluginsStore.getPluginById,
      getName: (item) => item.name,
      getDescription: (item) => item.description || item.type,
    },
    scheduledtask: {
      title: 'scheduledtasks.select',
      list: scheduledTasksStore.scheduledtasks,
      getById: scheduledTasksStore.getScheduledTaskById,
      getName: (item) => item.name,
      getDescription: (item) => t(`scheduledtask.${item.type}`),
    },
  }

  return configs[props.type]
})

const modalTitle = computed(() => props.title || resourceConfig.value.title)

let defaultSlot: Slot | undefined
let actionSlot: Slot | undefined

const DefineTemplate = (_: unknown, { slots }: SetupContext) => {
  defaultSlot = slots['default']
  actionSlot = slots['action']
  return null
}

const open = () => {
  const m = modal(
    {
      title: modalTitle.value,
      submit: false,
      afterClose: () => {
        emit('submit', model.value, getItems())
        m.destroy()
      },
      maskClosable: true,
      cancelText: 'common.close',
    },
    {
      default: defaultSlot,
      action: actionSlot,
    },
  )
  m.open()
}

const isBelowMinSelection = computed(() => model.value.length < props.min)

const getItems = (val = model.value) =>
  val.flatMap((id) => {
    const item = resourceConfig.value.getById(id)
    return item ? [item] : []
  })

const handleSelect = (item: ResourceItemMap<T>) => {
  const id = item.id

  const nextValue: string[] = []

  if (model.value.includes(id)) {
    nextValue.push(...model.value.filter((v) => v !== id))
  } else {
    nextValue.push(...model.value, id)
    if (nextValue.length > props.max) {
      message.warn('common.maxSelectionExceeded')
      return
    }
  }

  model.value = nextValue

  emit('change', nextValue, getItems(nextValue))
}

onMounted(async () => {
  if (props.openImmediate) {
    await nextTick()
    open()
  }
})
</script>

<template>
  <slot v-if="renderSlot" v-bind="{ selected: model, open }">
    <Button @click="open">{{ t('common.select') }}</Button>
  </slot>

  <DefineTemplate>
    <template #action>
      <Button class="mr-auto" type="text" size="small">
        {{
          isBelowMinSelection
            ? t('common.selectAtLeast', [props.min])
            : t('common.selectedCount', [model.length])
        }}
      </Button>
    </template>
    <Empty v-if="resourceConfig.list.length === 0" />
    <div class="grid gap-8" :class="[`grid-cols-${cols}`]">
      <Card
        v-for="item in resourceConfig.list"
        :key="item.id"
        :title="resourceConfig.getName(item)"
        :selected="model.includes(item.id)"
        @click="handleSelect(item)"
      >
        <div class="text-12 line-clamp-2">{{ resourceConfig.getDescription(item) }}</div>
      </Card>
    </div>
  </DefineTemplate>
</template>
