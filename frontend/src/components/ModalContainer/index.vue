<script lang="ts" setup>
interface Props {
  empty?: boolean
  scrollable?: boolean
}

const { scrollable = true } = defineProps<Props>()
</script>

<template>
  <div class="h-full flex flex-col">
    <div v-if="$slots.top" class="p-8 top-0">
      <slot name="top"></slot>
    </div>
    <slot v-if="empty" name="empty">
      <Empty />
    </slot>
    <ScrollView v-else-if="scrollable" :pt="0" :pr="16" :pb="16" :pl="16">
      <slot name="body"></slot>
    </ScrollView>
    <div v-else class="flex-1 overflow-hidden px-16 pb-16">
      <slot name="body"></slot>
    </div>
  </div>
</template>
