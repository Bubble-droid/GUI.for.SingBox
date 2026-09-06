<script setup lang="ts">
import { generateConfig } from '@profile/transformers/generator'
import { restoreProfile } from '@profile/transformers/restorer'
import type { Profile } from '@profile/types/profiles'
import { ref, inject, h, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { useProfilesStore } from '@/stores/profiles'
import { message } from '@/utils/interaction'

import Button from '@/components/Button/index.vue'

interface Props {
  profile: Profile
}

const { profile } = defineProps<Props>()

const loading = ref(false)
const profileText = ref('')

const { t } = useI18n()
const profilesStore = useProfilesStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  loading.value = true
  try {
    const subscriptions = profile.outbounds.reduce((p, c) => {
      c.outbounds.forEach((outbound) => {
        if (outbound.type !== 'Built-in') {
          const id = outbound.type === 'Subscription' ? outbound.id : outbound.type
          p.add(id)
        }
      })
      return p
    }, new Set<string>())
    const newProfile = restoreProfile(JSON.parse(profileText.value), profile.name, {
      profile,
      subscriptionIds: [...subscriptions],
    })
    newProfile.id = profile.id
    newProfile.mixin = profile.mixin
    newProfile.script = profile.script
    await profilesStore.editProfile(profile.id, newProfile)
    await handleSubmit()
  } catch (error: any) {
    console.log(error)
    message.error(error.message || error)
  }
  loading.value = false
}

onMounted(async () => {
  const config = await generateConfig(profile, {
    enableStableConfigCompat: false,
    enablePluginProcessing: false,
    enableMixinProcessing: false,
    enableScriptProcessing: false,
  })
  profileText.value = JSON.stringify(config, null, 2)
})

const modalSlots = {
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
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <CodeEditor v-model="profileText" lang="json" editable class="h-full" />
</template>
