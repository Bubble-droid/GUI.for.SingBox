<script lang="ts" setup>
import PortInput from '@profile/components/Shared/PortInput.vue'
import { createWireGuardPeer } from '@profile/defaults/endpoints'
import type { WireGuardEndpoint } from '@profile/types/profiles/endpoints'
import { useI18n } from 'vue-i18n'

const model = defineModel<WireGuardEndpoint['config']>({ required: true })
const { t } = useI18n()

const addPeer = () => {
  model.value.peers.push(createWireGuardPeer())
}

const deletePeer = (index: number) => {
  model.value.peers.splice(index, 1)
}
</script>

<template>
  <div class="form-item">
    {{ t('kernel.endpoints.wireguard.system') }}
    <Switch v-model="model.system" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.wireguard.name') }}
    <Input v-model="model.name" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.wireguard.mtu') }}
    <Input v-model="model.mtu" type="number" editable clearable />
  </div>
  <div
    class="form-item"
    :class="{
      'items-start': !!model.address.length,
    }"
  >
    {{ t('kernel.endpoints.wireguard.address') }}
    <InputList v-model="model.address" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.wireguard.private_key') }}
    <Input v-model="model.private_key" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.wireguard.listen_port') }}
    <PortInput v-model="model.listen_port" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.wireguard.workers') }}
    <Input v-model="model.workers" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.wireguard.peers.title') }}
    <Button icon="add" type="primary" @click="addPeer">
      {{ t('common.add') }}
    </Button>
  </div>
  <Empty v-if="!model.peers.length" />
  <div class="flex flex-col gap-8 mt-8">
    <Card v-for="(peer, index) in model.peers" :key="index" :title="`${index + 1}`">
      <template #extra>
        <Button icon="delete" type="text" size="small" @click="deletePeer(index)" />
      </template>
      <div class="form-item">
        {{ t('kernel.endpoints.wireguard.peers.address') }}
        <Input v-model="peer.address" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.wireguard.peers.port') }}
        <PortInput v-model="peer.port" />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.wireguard.peers.public_key') }}
        <Input v-model="peer.public_key" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.wireguard.peers.pre_shared_key') }}
        <Input v-model="peer.pre_shared_key" editable clearable />
      </div>
      <div
        class="form-item"
        :class="{
          'items-start': !!peer.allowed_ips.length,
        }"
      >
        {{ t('kernel.endpoints.wireguard.peers.allowed_ips') }}
        <InputList v-model="peer.allowed_ips" />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.wireguard.peers.persistent_keepalive_interval') }}
        <Input v-model="peer.persistent_keepalive_interval" type="number" editable clearable />
      </div>
      <div
        :class="{
          'items-start': !!peer.reserved.length,
        }"
        class="form-item"
      >
        {{ t('kernel.endpoints.wireguard.peers.reserved') }}
        <InputList v-model="peer.reserved" />
      </div>
    </Card>
  </div>
</template>
