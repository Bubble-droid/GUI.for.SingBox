<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

interface Props {
  pt?: number
  pr?: number
  pb?: number
  pl?: number
}

const { pt = 0, pr = 0, pb = 0, pl = 0 } = defineProps<Props>()

const scrollRef = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)
let resizeObserver: ResizeObserver | undefined

const updateOverflow = () => {
  const el = scrollRef.value
  if (!el) {
    return
  }

  hasOverflow.value = el.scrollHeight > el.clientHeight
}

const spacing = computed(() => {
  const paddingRight = hasOverflow.value ? pr - 8 - 6 : pr
  return {
    paddingLeft: `${pl}px`,
    marginRight: hasOverflow.value ? '8px' : undefined,
    paddingRight: paddingRight > 0 ? `${paddingRight}px` : undefined,
    paddingTop: `${pt}px`,
    paddingBottom: `${pb}px`,
  }
})

onMounted(async () => {
  await nextTick()
  updateOverflow()

  resizeObserver = new ResizeObserver(updateOverflow)

  if (scrollRef.value) {
    resizeObserver.observe(scrollRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="scrollRef" :style="spacing" class="gui-scroll-view flex-1 overflow-y-auto">
    <slot></slot>
  </div>
</template>

<style lang="less">
.gui-scroll-view::-webkit-scrollbar-track {
  margin-block: v-bind('pb+"px"');
}
</style>
