<script lang="ts" setup>
import { AcmeProvider } from '@features/constant/kernel'
import { AcmeProviderOptions, AcmeKeyTypeOptions } from '@features/constant/options'
import type { CertificateProviderAcme } from '@profiles/certificate_provider'
import Dns01ChallengeConfig from '@views/Shared/Dns01ChallengeConfig.vue'
import PortInput from '@views/Shared/PortInput.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks'

import type { ComponentOption } from '@/types/views'

interface Props {
  httpClientOptions: ComponentOption[]
  dnsServerOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<CertificateProviderAcme['config']>({ required: true })
const { t } = useI18n()

const providerSelect = computed({
  get() {
    const isPredefined = AcmeProviderOptions.some(
      (opt) => opt.value === model.value.provider && opt.value !== AcmeProvider.Custom,
    )
    return isPredefined ? model.value.provider : AcmeProvider.Custom
  },
  set(val) {
    if (val === AcmeProvider.Custom) {
      model.value.provider = '' as AcmeProvider
    } else {
      model.value.provider = val
    }
  },
})

const isCustomProvider = computed(() => providerSelect.value === AcmeProvider.Custom)

const [showEab, toggleEab] = useBool(false)
</script>

<template>
  <div class="form-item" :class="{ 'items-start': !!model.domain.length }">
    {{ t('kernel.certificate_providers.acme.domain') }}
    <InputList v-model="model.domain" />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.data_directory') }}
    <Input v-model="model.data_directory" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.default_server_name') }}
    <Input v-model="model.default_server_name" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.email') }}
    <Input v-model="model.email" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.provider.title') }}
    <Select v-model="providerSelect" :options="AcmeProviderOptions" />
  </div>
  <template v-if="isCustomProvider">
    <div class="form-item">
      {{ t('kernel.certificate_providers.acme.provider.custom') }}
      <Input v-model.lazy="model.provider" clearable />
    </div>
  </template>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.account_key') }}
    <Input v-model="model.account_key" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.disable_http_challenge') }}
    <Switch v-model="model.disable_http_challenge" />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.disable_tls_alpn_challenge') }}
    <Switch v-model="model.disable_tls_alpn_challenge" />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.alternative_http_port') }}
    <PortInput v-model="model.alternative_http_port" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.alternative_tls_port') }}
    <PortInput v-model="model.alternative_tls_port" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.key_type.title') }}
    <Select v-model="model.key_type" :options="AcmeKeyTypeOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.profile') }}
    <Input v-model="model.profile" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.acme.http_client') }}
    <Select v-model="model.http_client" :options="httpClientOptions" clearable />
  </div>

  <!-- External Account Binding -->
  <Divider>
    <Button type="text" size="small" @click="toggleEab">{{
      t('kernel.certificate_providers.acme.external_account.title')
    }}</Button>
  </Divider>
  <div v-show="showEab">
    <div class="form-item">
      {{ t('kernel.certificate_providers.acme.external_account.key_id') }}
      <Input v-model="model.external_account.key_id" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.certificate_providers.acme.external_account.mac_key') }}
      <Input v-model="model.external_account.mac_key" editable clearable />
    </div>
  </div>

  <Dns01ChallengeConfig v-model="model.dns01_challenge" :dns-server-options="dnsServerOptions" />
</template>
