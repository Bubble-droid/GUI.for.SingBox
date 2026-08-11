<script setup lang="ts">
import { Endpoint } from '@features/constant/kernel.ts'
import { generateConfig } from '@generator'
import type { Profile } from '@profiles'
import CertificateConfig from '@views/CertificateConfig.vue'
import CertificateProviderConfig from '@views/CertificateProviderConfig/CertificateProviderConfig.vue'
import DnsConfig from '@views/DnsConfig.vue'
import EndpointsConfig from '@views/EndpointsConfig/EndpointsConfig.vue'
import ExperimentalConfig from '@views/ExperimentalConfig.vue'
import HttpClientsConfig from '@views/HttpClientsConfig.vue'
import InboundsConfig from '@views/InboundsConfig.vue'
import LogConfig from '@views/LogConfig.vue'
import NetnsConfig from '@views/NetnsConfig/NetnsConfig.vue'
import NtpConfig from '@views/NtpConfig.vue'
import OutboundsConfig from '@views/OutboundsConfig.vue'
import RouteConfig from '@views/RouteConfig.vue'
import { ref, inject, computed, useTemplateRef, type Ref, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { ProfileStep, ProfileStepItems } from '@/constant/app.ts'
import { useProfilesStore } from '@/stores/profiles.ts'
import { message, modal } from '@/utils/interaction.ts'
import { deepClone } from '@/utils/others.ts'

import Button from '@/components/Button/index.vue'
import CodeViewer from '@/components/CodeViewer/index.vue'
import Dropdown from '@/components/Dropdown/index.vue'

import type { ComponentOption } from '@/types/views.ts'

import MixinAndScriptConfig from './MixinAndScriptConfig.vue'

interface Props {
  id?: string
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  isUpdate: false,
  step: ProfileStep.Name,
})

const { t } = useI18n()
const certProvidersRef = useTemplateRef('certProvidersRef')
const httpClientsRef = useTemplateRef('httpClientsRef')
const netnsRef = useTemplateRef('netnsRef')
const endpointsRef = useTemplateRef('endpointsRef')
const inboundsRef = useTemplateRef('inboundsRef')
const outboundsRef = useTemplateRef('outboundsRef')
const routeRef = useTemplateRef('routeRef')
const dnsRef = useTemplateRef('dnsRef')
const profilesStore = useProfilesStore()

const loading = ref(false)
const currentStep = ref(props.step)

const profile = ref<Profile>(profilesStore.getProfileTemplate())

const httpClientOptions = computed<ComponentOption[]>(() =>
  profile.value.http_clients
    .filter((v) => v.enable)
    .map((v) => ({
      label: v.tag,
      value: v.id,
    })),
)

const netnsOptions = computed<ComponentOption[]>(() =>
  profile.value.network_namespaces
    .filter((ns) => ns.enable)
    .map((ns) => ({
      label: ns.tag,
      value: ns.id,
    })),
)

const tailscaleOptions = computed<ComponentOption[]>(() =>
  profile.value.endpoints
    .filter((v) => v.enable && v.type === Endpoint.Tailscale)
    .map((v) => ({
      label: v.tag,
      value: v.id,
    })),
)

const inboundOptions = computed<ComponentOption[]>(() =>
  [...profile.value.endpoints, ...profile.value.inbounds]
    .filter((v) => v.enable)
    .map((v) => ({
      label: v.tag,
      value: v.id,
    })),
)

const outboundOptions = computed<ComponentOption[]>(() =>
  [...profile.value.endpoints.filter((v) => v.enable), ...profile.value.outbounds].map((v) => ({
    label: v.tag,
    value: v.id,
  })),
)

const dnsServerOptions = computed<ComponentOption[]>(() =>
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
    [ProfileStep.CertProviders]: certProvidersRef,
    [ProfileStep.HttpClients]: httpClientsRef,
    [ProfileStep.Netns]: netnsRef,
    [ProfileStep.Endpoints]: endpointsRef,
    [ProfileStep.Inbounds]: inboundsRef,
    [ProfileStep.Outbounds]: outboundsRef,
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
            ProfileStepItems.map((step, index) =>
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
      <LogConfig v-model="profile.log" />
    </div>
    <div v-if="currentStep === ProfileStep.Ntp">
      <NtpConfig
        v-model="profile.ntp"
        :netns-options="netnsOptions"
        :outbound-options="outboundOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Experimental">
      <ExperimentalConfig v-model="profile.experimental" :outbound-options="outboundOptions" />
    </div>
    <div v-if="currentStep === ProfileStep.Certificate">
      <CertificateConfig v-model="profile.certificate" />
    </div>
    <div v-if="currentStep === ProfileStep.CertProviders">
      <CertificateProviderConfig
        ref="certProvidersRef"
        v-model="profile.certificate_providers"
        :http-client-options="httpClientOptions"
        :tailscale-options="tailscaleOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.HttpClients">
      <HttpClientsConfig
        ref="httpClientsRef"
        v-model="profile.http_clients"
        :netns-options="netnsOptions"
        :outbound-options="outboundOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Netns">
      <NetnsConfig ref="netnsRef" v-model="profile.network_namespaces" />
    </div>
    <div v-if="currentStep === ProfileStep.Endpoints">
      <EndpointsConfig
        ref="endpointsRef"
        v-model="profile.endpoints"
        :netns-options="netnsOptions"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :dns-server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Inbounds">
      <InboundsConfig ref="inboundsRef" v-model="profile.inbounds" />
    </div>
    <div v-if="currentStep === ProfileStep.Outbounds">
      <OutboundsConfig ref="outboundsRef" v-model="profile.outbounds" />
    </div>
    <div v-if="currentStep === ProfileStep.Route">
      <RouteConfig
        ref="routeRef"
        v-model="profile.route"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :server-options="dnsServerOptions"
      />
    </div>
    <div v-if="currentStep === ProfileStep.Dns">
      <DnsConfig
        ref="dnsRef"
        v-model="profile.dns"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :rule-set="profile.route.rule_set"
      />
    </div>
    <div v-if="currentStep === ProfileStep.MixinScript">
      <MixinAndScriptConfig v-model="mixinAndScriptConfig" />
    </div>
  </div>
</template>
