<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  total: number
  size?: 'default' | 'small' | 'large'
  pageSize?: number
}

const model = defineModel<number>('current', { default: 1 })

const { total, size = 'default', pageSize = 9 } = defineProps<Props>()

const pageNum = computed(() => Math.ceil(total / pageSize))
const pages = computed(() => {
  const pageTotal = pageNum.value
  const current = model.value
  if (pageTotal <= 8) {
    return range(1, pageTotal)
  }
  if (current <= 4) {
    return [...range(1, 7), 'next', pageTotal] as const
  } else if (current >= pageTotal - 3) {
    return [1, 'prev', ...range(pageTotal - 6, pageTotal)] as const
  }
  return [1, 'prev', ...range(current - 2, current + 2), 'next', pageTotal] as const
})

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

const handlePrev = () => (model.value = Math.max(1, model.value - 1))
const handleNext = () => (model.value = Math.min(pageNum.value, model.value + 1))
const handleJump = (page: number | 'prev' | 'next') => {
  if (typeof page === 'number') {
    model.value = page
    return
  }
  if (page === 'prev') {
    model.value = Math.max(1, model.value - 5)
  } else if (page === 'next') {
    model.value = Math.min(pageNum.value, model.value + 5)
  }
}
</script>

<template>
  <div>
    <Button icon="arrowLeft" type="text" :size="size" @click="handlePrev" />
    <Button v-if="pages.length === 0" type="text" :size="size"> ... </Button>
    <Button
      v-for="item in pages"
      :key="item"
      :type="item === model ? 'primary' : 'text'"
      :size="size"
      class="min-w-32"
      @click="handleJump(item)"
    >
      {{ item === 'prev' || item === 'next' ? '...' : item }}
    </Button>
    <Button icon="arrowRight" type="text" :size="size" @click="handleNext" />
  </div>
</template>
