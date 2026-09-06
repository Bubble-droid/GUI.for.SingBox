<script setup lang="ts">
import CertProviderList from '@profile/components/cert-provider/CertProviderList.vue'
import EndpointList from '@profile/components/endpoint/EndpointList.vue'
import NetnsList from '@profile/components/netns/NetnsList.vue'
import OutboundList from '@profile/components/outbound/OutboundList.vue'
import { EndpointType } from '@profile/constant/kernel.ts'
import { generateConfig } from '@profile/transformers/generator/index.ts'
import type { Profile } from '@profile/types/profiles/index.ts'
import { ref, inject, computed, useTemplateRef, h } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { ProfileStep, ProfileStepItems } from '@/constant/app'
import { useProfilesStore } from '@/stores/profiles.ts'
import { message, modal } from '@/utils/interaction.ts'
import { deepClone } from '@/utils/others.ts'

import Button from '@/components/Button/index.vue'
import CodeViewer from '@/components/CodeViewer/index.vue'
import Dropdown from '@/components/Dropdown/index.vue'

import type { OptionItem } from '@/types/component.ts'

import CertForm from './cert/CertForm.vue'
import DnsPanel from './dns/DnsPanel.vue'
import ExperimentalForm from './experimental/ExperimentalForm.vue'
import HttpClientList from './http-client/HttpClientList.vue'
import InboundList from './inbound/InboundList.vue'
import LogForm from './log/LogForm.vue'
import MixinAndScriptPanel from './MixinAndScriptPanel.vue'
import NtpForm from './ntp/NtpForm.vue'
import RoutePanel from './route/RoutePanel.vue'

interface Props {
  id?: string
  step?: number
}

const { id = '', step = ProfileStep.Name } = defineProps<Props>()

const { t } = useI18n()
const certProviderRef = useTemplateRef('certProviderRef')
const httpClientRef = useTemplateRef('httpClientRef')
const netnsRef = useTemplateRef('netnsRef')
const endpointRef = useTemplateRef('endpointRef')
const inboundRef = useTemplateRef('inboundRef')
const outboundRef = useTemplateRef('outboundRef')
const routeRef = useTemplateRef('routeRef')
const dnsRef = useTemplateRef('dnsRef')
const profilesStore = useProfilesStore()

const loading = ref(false)
const currentStep = ref(step)

const profile = ref<Profile>(profilesStore.getProfileTemplate())

const httpClientOptions = computed<OptionItem[]>(() =>
  profile.value.httpClients
    .filter((v) => v.enable)
    .map((v) => ({
      label: v.tag,
      value: v.id,
    })),
)

const netnsOptions = computed<OptionItem[]>(() =>
  profile.value.netns
    .filter((ns) => ns.enable)
    .map((ns) => ({
      label: ns.tag,
      value: ns.id,
    })),
)

const tailscaleOptions = computed<OptionItem[]>(() =>
  profile.value.endpoints
    .filter((v) => v.enable && v.type === EndpointType.Tailscale)
    .map((v) => ({
      label: v.tag,
      value: v.id,
    })),
)

const inboundOptions = computed<OptionItem[]>(() =>
  [...profile.value.endpoints, ...profile.value.inbounds]
    .filter((v) => v.enable)
    .map((v) => ({
      label: v.tag,
      value: v.id,
    })),
)

const outboundOptions = computed<OptionItem[]>(() =>
  [...profile.value.endpoints.filter((v) => v.enable), ...profile.value.outbounds].map((v) => ({
    label: v.tag,
    value: v.id,
  })),
)

const dnsServerOptions = computed<OptionItem[]>(() =>
  profile.value.dns.servers.map((v) => ({ label: v.tag, value: v.id })),
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
    if (id) {
      await profilesStore.editProfile(id, profile.value)
    } else {
      await profilesStore.addProfile(profile.value)
    }
    await handleSubmit()
  } catch (error: any) {
    console.error('handleSave:', error)
    message.error(error)
  }
  loading.value = false
}

const handleAdd = () => {
  const map: Record<number, Ref> = {
    [ProfileStep.CertProviders]: certProviderRef,
    [ProfileStep.HttpClients]: httpClientRef,
    [ProfileStep.Netns]: netnsRef,
    [ProfileStep.Endpoints]: endpointRef,
    [ProfileStep.Inbounds]: inboundRef,
    [ProfileStep.Outbounds]: outboundRef,
    [ProfileStep.Route]: routeRef,
    [ProfileStep.Dns]: dnsRef,
  }
  map[currentStep.value]!.value.handleAdd()
}

const handlePreview = async () => {
  try {
    const config = await generateConfig(profile.value)
    const m = modal({
      title: profile.value.name,
      cancelText: 'common.close',
      height: '90',
      width: '90',
      submit: false,
      maskClosable: true,
    })
    m.setContent(CodeViewer, {
      modelValue: JSON.stringify(config, null, 2),
      lang: 'json',
      copyable: true,
    }).open()
  } catch (error) {
    message.error(error)
  }
}

if (id) {
  const p = profilesStore.getProfileById(id)
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
            {
              class: 'font-bold',
            },
            `${t(ProfileStepItems[currentStep.value]!.title)} （${currentStep.value + 1} / ${ProfileStepItems.length}）`,
          ),
        overlay: () =>
          h(
            'div',
            {
              class: 'p-4 flex flex-col',
            },
            ProfileStepItems.map((item, index) =>
              h(
                Button,
                {
                  type: currentStep.value === index ? 'link' : 'text',
                  disabled: !profile.value.name && currentStep.value !== index,
                  onClick: () => (currentStep.value = index),
                },
                () => t(item.title),
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
          ProfileStep.CertProviders,
          ProfileStep.HttpClients,
          ProfileStep.Netns,
          ProfileStep.Endpoints,
          ProfileStep.Inbounds,
          ProfileStep.Outbounds,
          ProfileStep.Route,
          ProfileStep.Dns,
        ].includes(currentStep.value)
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
        disabled: currentStep.value === ProfileStep.Name,
        onClick: handlePrevStep,
      },
      () => t('common.prevStep'),
    ),
    h(
      Button,
      {
        class: 'mr-auto',
        disabled: !profile.value.name || currentStep.value === ProfileStepItems.length - 1,
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
    <div v-if="currentStep === ProfileStep.Name">
      <Input
        v-model="profile.name"
        autofocus
        :border="false"
        :placeholder="t('profile.name')"
        class="w-full"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Log">
      <LogForm v-model="profile.log" />
    </div>
    <div v-if="currentStep === ProfileStep.Ntp">
      <NtpForm
        v-model="profile.ntp"
        :netns-options="netnsOptions"
        :outbound-options="outboundOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Experimental">
      <ExperimentalForm v-model="profile.experimental" :outbound-options="outboundOptions" />
    </div>
    <div v-if="currentStep === ProfileStep.Certificate">
      <CertForm v-model="profile.cert" />
    </div>
    <div v-if="currentStep === ProfileStep.CertProviders">
      <CertProviderList
        ref="certProviderRef"
        v-model="profile.certProviders"
        :http-client-options="httpClientOptions"
        :tailscale-options="tailscaleOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.HttpClients">
      <HttpClientList
        ref="httpClientRef"
        v-model="profile.httpClients"
        :netns-options="netnsOptions"
        :outbound-options="outboundOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Netns">
      <NetnsList ref="netnsRef" v-model="profile.netns" />
    </div>
    <div v-if="currentStep === ProfileStep.Endpoints">
      <EndpointList
        ref="endpointRef"
        v-model="profile.endpoints"
        :netns-options="netnsOptions"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Inbounds">
      <InboundList ref="inboundRef" v-model="profile.inbounds" />
    </div>
    <div v-if="currentStep === ProfileStep.Outbounds">
      <OutboundList ref="outboundRef" v-model="profile.outbounds" />
    </div>
    <div v-if="currentStep === ProfileStep.Route">
      <RoutePanel
        ref="routeRef"
        v-model="profile.route"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Dns">
      <DnsPanel
        ref="dnsRef"
        v-model="profile.dns"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :rule-set="profile.route.rule_set"
      />
    </div>
    <div v-if="currentStep === ProfileStep.MixinScript">
      <MixinAndScriptPanel v-model="mixinAndScriptConfig" />
    </div>
  </div>
</template>
