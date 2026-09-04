<script lang="ts" setup>
import { Dns01Provider } from '@profile/constant/kernel'
import { Dns01ProviderOptions } from '@profile/constant/options'
import { createDns01Challenge } from '@profile/defaults/shared'
import type { Dns01ChallengeForm } from '@profile/types/profiles/shared'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks/useBool'

import type { OptionItem } from '@/types/component'

interface Props {
  dnsServerOptions: OptionItem[]
}

defineProps<Props>()
const model = defineModel<Dns01ChallengeForm>({ required: true })
const { t } = useI18n()

const [showDns01, toggleDns01] = useBool(false)

const onProviderChange = (newProvider: Dns01Provider) => {
  const base = {
    ttl: model.value.ttl,
    propagation_delay: model.value.propagation_delay,
    propagation_timeout: model.value.propagation_timeout,
    resolvers: model.value.resolvers,
    override_domain: model.value.override_domain,
  }
  const fresh = createDns01Challenge(newProvider)
  model.value = {
    ...fresh,
    ...base,
  }
}
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleDns01">
      {{ t('kernel.shared.dns01.title') }}
    </Button>
  </Divider>
  <div v-show="showDns01">
    <div class="form-item">
      {{ t('kernel.shared.dns01.ttl') }}
      <Input v-model="model.ttl" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.dns01.propagation_delay') }}
      <Input v-model="model.propagation_delay" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.dns01.propagation_timeout') }}
      <Input v-model="model.propagation_timeout" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.dns01.resolvers') }}
      <MultipleSelect
        v-model="model.resolvers"
        style="max-width: 220px"
        :options="dnsServerOptions"
        clearable
      />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.dns01.override_domain') }}
      <Input v-model="model.override_domain" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.dns01.provider.title') }}
      <Select
        :model-value="model.provider"
        :options="Dns01ProviderOptions"
        clearable
        @update:model-value="onProviderChange"
      />
    </div>

    <!-- AliDNS -->
    <template v-if="model.provider === Dns01Provider.AliDns">
      <div class="form-item">
        {{ t('kernel.shared.dns01.alidns.access_key_id') }}
        <Input v-model="model.access_key_id" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.dns01.alidns.access_key_secret') }}
        <Input v-model="model.access_key_secret" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.dns01.alidns.region_id') }}
        <Input v-model="model.region_id" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.dns01.alidns.security_token') }}
        <Input v-model="model.security_token" editable clearable />
      </div>
    </template>

    <!-- Cloudflare -->
    <template v-else-if="model.provider === Dns01Provider.Cloudflare">
      <div class="form-item">
        {{ t('kernel.shared.dns01.cloudflare.api_token') }}
        <Input v-model="model.api_token" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.dns01.cloudflare.zone_token') }}
        <Input v-model="model.zone_token" editable clearable />
      </div>
    </template>

    <!-- ACME-DNS -->
    <template v-else-if="model.provider === Dns01Provider.AcmeDns">
      <div class="form-item">
        {{ t('kernel.shared.dns01.acmedns.username') }}
        <Input v-model="model.username" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.dns01.acmedns.password') }}
        <Input v-model="model.password" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.dns01.acmedns.subdomain') }}
        <Input v-model="model.subdomain" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.dns01.acmedns.server_url') }}
        <Input v-model="model.server_url" editable clearable />
      </div>
    </template>
  </div>
</template>
