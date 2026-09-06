<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  percent: number
  status?: 'primary' | 'warning' | 'danger'
  type?: 'circle' | 'line'
  radius?: number
}

const { percent, status = 'primary', type = 'line', radius = 100 } = defineProps<Props>()

const innerStyle = computed(() => ({
  width: `${percent > 100 ? 100 : percent || 0}%`,
}))

const circleStyle = computed(() => {
  const color = { warning: '#FFC107', danger: '#F44336', primary: 'var(--progress-inner-bg)' }[
    status
  ]
  const size = `${radius * 2}px`
  const p = Math.min(percent || 0, 100)
  const mask = `radial-gradient(transparent ${radius * 0.6}px, #fff 0px)`
  const bg = `conic-gradient(${color} 0%, ${color} ${p}%, var(--progress-bg) ${p}%, var(--progress-bg) 100%)`

  return {
    width: size,
    height: size,
    background: bg,
    mask,
    '-webkit-mask': mask,
  }
})
</script>

<template>
  <div v-if="type === 'line'" class="gui-progress-line h-10 rounded-8 overflow-hidden">
    <div :style="innerStyle" :class="status" class="inner h-full rounded-8 duration-200"></div>
  </div>
  <div
    v-if="type === 'circle'"
    :style="circleStyle"
    class="gui-progress-circle relative rounded-full"
  ></div>
</template>

<style lang="less" scoped>
.gui-progress-line {
  background-color: var(--progress-bg);
  .inner {
    background-color: var(--progress-inner-bg);
  }
  .warning {
    background-color: #ffc107;
  }
  .danger {
    background-color: #f44336;
  }
}
</style>
