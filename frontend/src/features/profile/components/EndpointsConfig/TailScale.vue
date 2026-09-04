<script lang="ts" setup>
import PortInput from '@profile/components/Shared/PortInput.vue'
import type { TailscaleEndpoint } from '@profile/types/profiles/endpoint'
import { useI18n } from 'vue-i18n'

const model = defineModel<TailscaleEndpoint['config']>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.state_directory') }}
    <Input v-model="model.state_directory" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.auth_key') }}
    <Input v-model="model.auth_key" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.control_url') }}
    <Input v-model="model.control_url" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.ephemeral') }}
    <Switch v-model="model.ephemeral" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.hostname') }}
    <Input v-model="model.hostname" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.accept_routes') }}
    <Switch v-model="model.accept_routes" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.exit_node') }}
    <Input v-model="model.exit_node" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.exit_node_allow_lan_access') }}
    <Switch v-model="model.exit_node_allow_lan_access" />
  </div>
  <div
    class="form-item"
    :class="{
      'items-start': !!model.advertise_routes.length,
    }"
  >
    {{ t('kernel.endpoints.tailscale.advertise_routes') }}
    <InputList v-model="model.advertise_routes" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.advertise_exit_node') }}
    <Switch v-model="model.advertise_exit_node" />
  </div>
  <div
    class="form-item"
    :class="{
      'items-start': !!model.advertise_tags.length,
    }"
  >
    {{ t('kernel.endpoints.tailscale.advertise_tags') }}
    <InputList v-model="model.advertise_tags" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.relay_server_port') }}
    <PortInput v-model="model.relay_server_port" editable />
  </div>
  <div
    class="form-item"
    :class="{
      'items-start': !!model.relay_server_static_endpoints.length,
    }"
  >
    {{ t('kernel.endpoints.tailscale.relay_server_static_endpoints') }}
    <InputList v-model="model.relay_server_static_endpoints" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.system_interface') }}
    <Switch v-model="model.system_interface" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.system_interface_name') }}
    <Input v-model="model.system_interface_name" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.system_interface_mtu') }}
    <Input v-model="model.system_interface_mtu" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.udp_timeout') }}
    <Input v-model="model.udp_timeout" editable clearable />
  </div>
  <Divider>{{ t('kernel.endpoints.tailscale.ssh_server.title') }} </Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.ssh_server.enabled') }}
    <Switch v-model="model.ssh_server.enabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.ssh_server.disable_pty') }}
    <Switch v-model="model.ssh_server.disable_pty" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.ssh_server.disable_sftp') }}
    <Switch v-model="model.ssh_server.disable_sftp" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.tailscale.ssh_server.disable_forwarding') }}
    <Switch v-model="model.ssh_server.disable_forwarding" />
  </div>
</template>
