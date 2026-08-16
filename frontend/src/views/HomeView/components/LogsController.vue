<script lang="ts" setup>
import { LogLevelOptions } from '@features/constant/options'
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks/useBool'
import { useKernelApiStore } from '@/stores/kernelApi'
import { addToRuleSet } from '@/utils/helper'
import { message, picker } from '@/utils/interaction'
import { isValidIPv4, isValidIPv6 } from '@/utils/is'
import { buildSmartRegExp, getDomainSuffixes } from '@/utils/others'

import type { PickerItem } from '@/components/Picker/types'
import type { CoreApiLogsData } from '@/types/kernel'
import type { RuleCandidate } from '@/types/views'

const logType = ref<'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic'>('info')
const keywords = ref('')
const logs = ref<CoreApiLogsData[]>([])

const LogLevelMap = {
  trace: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'panic'],
  debug: ['debug', 'info', 'warn', 'error', 'fatal', 'panic'],
  info: ['info', 'warn', 'error', 'fatal', 'panic'],
  warn: ['warn', 'error', 'fatal', 'panic'],
  error: ['error', 'fatal', 'panic'],
  fatal: ['fatal', 'panic'],
  panic: ['panic'],
}

const filteredLogs = computed(() => {
  return logs.value.filter((v) => {
    const hitType = LogLevelMap[logType.value].includes(v.type)
    const hitName = buildSmartRegExp(keywords.value, 'i').test(v.payload)
    return hitName && hitType
  })
})

const menus: App.Menu[] = (
  [
    ['home.connections.addToDirect', 'direct'],
    ['home.connections.addToProxy', 'proxy'],
    ['home.connections.addToReject', 'reject'],
  ] as const
).map(([label, ruleset]) => {
  return {
    label,
    handler: async ({ type: _, payload }: CoreApiLogsData) => {
      const regex =
        /\[([0-9a-fA-F:.]{2,})\](?::\d+)?|((?:\d{1,3}\.){3}\d{1,3})(?::\d+)?|((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(?::\d+)?|((?=[0-9a-fA-F:]*:)[0-9a-fA-F:.]{2,})/gu
      const matches = payload.matchAll(regex)

      const options: PickerItem<RuleCandidate>[] = []

      for (const [, bracketed, ipv4, domain, ipv6] of matches) {
        const token = bracketed ?? ipv4 ?? domain ?? ipv6
        if (!token) continue

        let ip = token
        let prefix = 0
        if (isValidIPv6(ip)) {
          prefix = 128
        } else if (isValidIPv4(ip)) {
          prefix = 32
        } else {
          const host = ip.match(/^(.+):(\d{1,5})$/u)
          if (host && isValidIPv6(host[1]!)) {
            ip = host[1]!
            prefix = 128
          }
        }

        if (prefix > 0) {
          options.push({
            label: t('kernel.rules.type.ip_cidr'),
            value: { ip_cidr: ip + '/' + prefix },
            description: ip,
          })
        } else if (token.includes('.')) {
          options.push({
            label: t('kernel.rules.type.domain'),
            value: { domain: token },
            description: token,
          })
          getDomainSuffixes(token).forEach((suffix) => {
            options.push({
              label: t('kernel.rules.type.domain_suffix'),
              value: { domain_suffix: suffix },
              description: suffix,
            })
          })
        }
      }

      const payloads = await picker.multi('rulesets.selectRuleType', options)

      try {
        await addToRuleSet(ruleset, payloads)
        message.success('common.success')
      } catch (error: any) {
        message.error(error)
        console.log(error)
      }
    },
  }
})

const { t } = useI18n()
const [pause, togglePause] = useBool(false)
const kernelApiStore = useKernelApiStore()

const handleClear = () => logs.value.splice(0)

const unregisterLogsHandler = kernelApiStore.onLogs((data) => {
  pause.value || logs.value.unshift(data)
})

onUnmounted(() => {
  unregisterLogsHandler()
})
</script>

<template>
  <ModalContainer :empty="filteredLogs.length === 0">
    <template #top>
      <div class="flex items-center">
        <Select v-model="logType" :options="LogLevelOptions" size="small" />
        <Input
          v-model="keywords"
          clearable
          size="small"
          :placeholder="t('common.keywords')"
          class="ml-8 flex-1"
        />
        <Button
          :icon="pause ? 'play' : 'pause'"
          type="text"
          size="small"
          class="ml-8"
          @click="togglePause"
        />
        <Button
          v-tips="'common.clear'"
          icon="clear"
          size="small"
          type="text"
          @click="handleClear"
        />
      </div>
    </template>

    <template #body>
      <div
        v-for="log in filteredLogs"
        :key="log.payload"
        v-menu="menus.map((v) => ({ ...v, handler: () => v.handler?.(log) }))"
        class="log select-text text-12 py-2 my-4"
      >
        <span class="type inline-block text-center">{{ log.type }}</span> {{ log.payload }}
      </div>
    </template>
  </ModalContainer>
</template>

<style lang="less" scoped>
.log {
  background: var(--card-bg);
  &:hover {
    color: #fff;
    background: var(--primary-color);
    .type {
      color: #fff;
    }
  }
}

.type {
  width: 50px;
  color: var(--primary-color);
}
</style>
