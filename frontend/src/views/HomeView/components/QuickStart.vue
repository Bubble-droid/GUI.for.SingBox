<script setup lang="ts">
import { useModalContext } from '@components/Modal'
import { h, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppSettingsStore } from '@/stores/appSettings'
import { useProfilesStore } from '@/stores/profiles'
import { useSubscribesStore } from '@/stores/subscribes'
import { message } from '@/utils/interaction'
import { sampleID } from '@/utils/others'

import Button from '@/components/Button/index.vue'

const { cancel, submit } = useModalContext()

const { t } = useI18n()
const subscribeStore = useSubscribesStore()
const profilesStore = useProfilesStore()
const appSettingsStore = useAppSettingsStore()

const url = ref('')
const name = ref('')
const loading = ref(false)

const handleSave = async () => {
  if (!name.value) {
    name.value = sampleID()
  }

  const sub = subscribeStore.getSubscribeTemplate(name.value, { url: url.value })

  loading.value = true

  try {
    await subscribeStore.addSubscribe(sub)
    await subscribeStore.updateSubscribe(sub.id)
  } catch (error: any) {
    loading.value = false
    console.log(error)
    message.error(error)
    subscribeStore.deleteSubscribe(sub.id)
    return
  }

  const profile = profilesStore.getProfileTemplate(name.value)

  if (profile.outbounds[0] && profile.outbounds[1]) {
    profile.outbounds[0].outbounds.push({ id: sub.id, tag: sub.id, type: 'Subscription' })
    profile.outbounds[1].outbounds.push({ id: sub.id, tag: sub.id, type: 'Subscription' })
  }

  await profilesStore.addProfile(profile)

  appSettingsStore.app.kernel.profile = profile.id

  message.success('home.initSuccessful')

  loading.value = false

  submit()
}

const modalSlots = {
  cancel: () =>
    h(
      Button,
      {
        disabled: loading.value,
        onClick: cancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        disabled: !/^https?:\/\//.test(url.value),
        loading: loading.value,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div class="flex gap-4">
    <Input v-model="name" :placeholder="$t('profile.name')" auto-size clearable class="w-[25%]" />
    <Input v-model="url" placeholder="http(s)://" autofocus clearable allow-paste class="w-[75%]" />
  </div>
</template>
