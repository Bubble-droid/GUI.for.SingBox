<script setup lang="ts">
import { ref, inject, computed, useTemplateRef, h, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { CommonRuleType, RuleSetType, RuleType, Step } from '@/enums'
import { useProfilesStore } from '@/stores'
import { deepClone, generateConfig, message, modal } from '@/utils'

import Button from '@/components/Button/index.vue'
import CodeViewer from '@/components/CodeViewer/index.vue'
import Dropdown from '@/components/Dropdown/index.vue'

import type { ComponentOption, Profile, RouteRuleItem, RouteRuleProfile } from '@/types'

import DnsConfig from './DnsConfig.vue'
import EndpointsConfig from './EndpointsConfig.vue'
import ExperimentalConfig from './ExperimentalConfig.vue'
import HttpClientsConfig from './HttpClientsConfig.vue'
import InboundsConfig from './InboundsConfig.vue'
import LogConfig from './LogConfig.vue'
import MixinAndScript from './MixinAndScriptConfig.vue'
import NtpConfig from './NtpConfig.vue'
import OutboundsConfig from './OutboundsConfig.vue'
import RouteConfig from './RouteConfig.vue'
import ServicesConfig from './ServicesConfig/index.vue'

interface Props {
  id?: string
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  step: Step.Name,
})

const { t } = useI18n()
const endpointsRef = useTemplateRef('endpointsRef')
const servicesRef = useTemplateRef('servicesRef')
const httpClientsRef = useTemplateRef('httpClientsRef')
const inboundsRef = useTemplateRef('inboundsRef')
const outboundsRef = useTemplateRef('outboundsRef')
const routeRef = useTemplateRef('routeRef')
const dnsRef = useTemplateRef('dnsRef')
const profilesStore = useProfilesStore()

const loading = ref(false)
const currentStep = ref(props.step)

const stepItems = [
  { title: 'profile.step.name' },
  { title: 'profile.step.log' },
  { title: 'profile.step.ntp' },
  { title: 'profile.step.experimental' },
  { title: 'profile.step.endpoints' },
  { title: 'profile.step.services' },
  { title: 'profile.step.http_clients' },
  { title: 'profile.step.inbounds' },
  { title: 'profile.step.outbounds' },
  { title: 'profile.step.route' },
  { title: 'profile.step.dns' },
  { title: 'profile.step.mixin-script' },
] as const

const profile = ref<Profile>(profilesStore.getProfileTemplate())

const clashModeOptions = computed<ComponentOption[]>(() => {
  const allConditions = [
    ...profile.value.route.rules,
    ...(profile.value.dns.rules as RouteRuleProfile[]),
  ].flatMap((rule): RouteRuleItem[] => {
    if (rule.type === RuleType.Default) {
      return rule.ruleConditions
    } else if (rule.type === RuleType.Logical) {
      return rule.ruleConditions.rules.flatMap((r) => r.conditions)
    } else {
      try {
        const r = JSON.parse(rule.ruleConditions) as { clash_mode?: string }
        if (!r.clash_mode) return []
        return [{ type: CommonRuleType.ClashMode, value: r.clash_mode }]
      } catch {
        return []
      }
    }
  })

  const values = allConditions
    .filter((c) => c.type === CommonRuleType.ClashMode)
    .map((c) => c.value)

  values.push('rule')

  return Array.from(new Set(values), (value) => ({
    label: t(`kernel.rules.clash_mode.${value}`, value),
    value,
  }))
})

const httpClientOptions = computed(() =>
  profile.value.http_clients.map((v) => ({
    label: v.tag,
    value: v.id,
  })),
)

const inboundOptions = computed(() =>
  [...profile.value.endpoints, ...profile.value.inbounds].map((v) => ({
    label: v.tag,
    value: v.id,
  })),
)

const outboundOptions = computed(() =>
  [...profile.value.endpoints, ...profile.value.outbounds].map((v) => ({
    label: v.tag,
    value: v.id,
  })),
)

const serverOptions = computed(() =>
  profile.value.dns.servers.map((v) => ({ label: v.tag, value: v.id })),
)

const ruleSetOptions = computed<ComponentOption[]>(() =>
  profile.value.route.rule_set.flatMap((v) => {
    if (v.type !== RuleSetType.Remote) return [{ label: v.tag, value: v.id }]
    return v.tag.map((tag, i) => ({
      label: tag,
      value: `${v.id}_${i}`,
    }))
  }),
)

const mixinAndScriptConfig = computed({
  get() {
    return { mixin: profile.value.mixin, script: profile.value.script }
  },
  set({ mixin, script }) {
    profile.value.mixin = mixin
    profile.value.script = script
  },
})

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any
const handlePrevStep = () => currentStep.value--
const handleNextStep = () => currentStep.value++

const handleSave = async () => {
  loading.value = true
  try {
    if (props.id) {
      await profilesStore.editProfile(props.id, profile.value)
    } else {
      await profilesStore.addProfile(profile.value)
    }
    await handleSubmit()
  } catch (error: any) {
    console.error('handleSave: ', error)
    message.error(error)
  }
  loading.value = false
}

const handleAdd = () => {
  const map: Record<number, Ref> = {
    [Step.Endpoints]: endpointsRef,
    [Step.Services]: servicesRef,
    [Step.HttpClients]: httpClientsRef,
    [Step.Inbounds]: inboundsRef,
    [Step.Outbounds]: outboundsRef,
    [Step.Route]: routeRef,
    [Step.Dns]: dnsRef,
  }
  map[currentStep.value]?.value?.handleAdd()
}

const handlePreview = async () => {
  try {
    const config = await generateConfig(profile.value)
    const m = modal({ title: profile.value.name, width: '90', height: '90' })
    m.setContent(CodeViewer, {
      modelValue: JSON.stringify(config, null, 2),
      lang: 'json',
    }).open()
  } catch (error: any) {
    message.error(error.message || error)
  }
}

if (props.id) {
  const p = profilesStore.getProfileById(props.id)
  if (p) {
    profile.value = deepClone(p)
  }
}

const modalSlots = {
  title: () =>
    h(
      Dropdown,
      {},
      {
        default: () =>
          h(
            'div',
            { class: 'font-bold' },
            `${t(stepItems[currentStep.value]!.title)} （${currentStep.value + 1} / ${stepItems.length}）`,
          ),
        overlay: () =>
          h(
            'div',
            { class: 'p-4 flex flex-col' },
            stepItems.map((step, index) =>
              h(
                Button,
                {
                  type: currentStep.value === index ? 'link' : 'text',
                  disabled: !profile.value.name && currentStep.value !== index,
                  onClick: () => (currentStep.value = index),
                },
                () => t(step.title),
              ),
            ),
          ),
      },
    ),

  toolbar: () => [
    h(Button, {
      type: 'text',
      icon: 'file',
      onClick: handlePreview,
    }),
    h(Button, {
      type: 'text',
      icon: 'add',
      style: {
        display: [
          Step.Endpoints,
          Step.Services,
          Step.HttpClients,
          Step.Inbounds,
          Step.Outbounds,
          Step.Route,
          Step.Dns,
        ].includes(currentStep.value as any)
          ? ''
          : 'none',
      },
      onClick: handleAdd,
    }),
  ],
  action: () => [
    h(
      Button,
      {
        disabled: currentStep.value === Step.Name,
        onClick: handlePrevStep,
      },
      () => t('common.prevStep'),
    ),
    h(
      Button,
      {
        class: 'mr-auto',
        disabled: !profile.value.name || currentStep.value === stepItems.length - 1,
        onClick: handleNextStep,
      },
      () => t('common.nextStep'),
    ),
  ],
  cancel: () =>
    h(
      Button,
      {
        disabled: loading.value,
        onClick: handleCancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        loading: loading.value,
        disabled: !profile.value.name,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div>
    <div v-if="currentStep === Step.Name">
      <Input
        v-model="profile.name"
        autofocus
        :border="false"
        :placeholder="t('profile.name')"
        class="w-full"
      />
    </div>
    <div v-if="currentStep === Step.Log">
      <LogConfig v-model="profile.log" />
    </div>
    <div v-if="currentStep === Step.Ntp">
      <NtpConfig
        v-model="profile.ntp"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
      />
    </div>
    <div v-if="currentStep === Step.experimental">
      <ExperimentalConfig
        v-model="profile.experimental"
        :outbound-options="outboundOptions"
        :mode-options="clashModeOptions"
      />
    </div>
    <div v-if="currentStep === Step.Endpoints">
      <EndpointsConfig
        ref="endpointsRef"
        v-model="profile.endpoints"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
      />
    </div>
    <div v-if="currentStep === Step.Services">
      <ServicesConfig
        ref="servicesRef"
        v-model="profile.services"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
        :http-client-options="httpClientOptions"
      />
    </div>
    <div v-if="currentStep === Step.HttpClients">
      <HttpClientsConfig
        ref="httpClientsRef"
        v-model="profile.http_clients"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
      />
    </div>
    <div v-if="currentStep === Step.Inbounds">
      <InboundsConfig
        ref="inboundsRef"
        v-model="profile.inbounds"
        :rule-set-options="ruleSetOptions"
        :inbound-options="inboundOptions"
      />
    </div>
    <div v-if="currentStep === Step.Outbounds">
      <OutboundsConfig
        ref="outboundsRef"
        v-model="profile.outbounds"
        :endpoints="profile.endpoints"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
      />
    </div>
    <div v-if="currentStep === Step.Route">
      <RouteConfig
        ref="routeRef"
        v-model="profile.route"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
        :rule-set-options="ruleSetOptions"
        :http-client-options="httpClientOptions"
      />
    </div>
    <div v-if="currentStep === Step.Dns">
      <DnsConfig
        ref="dnsRef"
        v-model="profile.dns"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :rule-set-options="ruleSetOptions"
      />
    </div>
    <div v-if="currentStep === Step.MixinScript">
      <MixinAndScript v-model="mixinAndScriptConfig" />
    </div>
  </div>
</template>
