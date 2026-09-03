<script setup lang="ts">
import { generateConfig } from '@generator'
import type { Profile } from '@profiles'
import { useI18n, I18nT } from 'vue-i18n'

import { ClipboardSetText } from '@wails/runtime/runtime.js'

import { DraggableOptions, ProfileMenuList, ViewOptions } from '@/constant/app'
import { View } from '@/enums/app'
import { useAppStore } from '@/stores/app.ts'
import { useAppSettingsStore } from '@/stores/appSettings.ts'
import { useKernelApiStore } from '@/stores/kernelApi.ts'
import { usePluginsStore } from '@/stores/plugins.ts'
import { useProfilesStore } from '@/stores/profiles.ts'
import { useSubscribesStore } from '@/stores/subscribes.ts'
import { alert, message, modal } from '@/utils/interaction.ts'
import { deepClone, sampleID, debounce } from '@/utils/others.ts'

import CodeViewer from '@/components/CodeViewer/index.vue'

import type * as App from '@/types/app'

import ProfileEditor from './components/ProfileEditor.vue'
import ProfileForm from './components/ProfileForm.vue'

const { t } = useI18n()
const appStore = useAppStore()
const profilesStore = useProfilesStore()
const subscribesStore = useSubscribesStore()
const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()
const pluginsStore = usePluginsStore()

const menuList: App.Menu[] = ProfileMenuList.map((v, i) => {
  return {
    label: v,
    handler: (id: string) => {
      const p = profilesStore.getProfileById(id)
      p && handleShowProfileForm(p.id, i)
    },
  }
})

const secondaryMenusList: App.Menu[] = [
  {
    label: 'profiles.start',
    handler: async (id: string) => {
      appSettingsStore.app.kernel.profile = id
      try {
        const e = await kernelApiStore.stopCore().catch((error) => error)
        if (e && e !== 'The core is not running') {
          throw e
        }
        await kernelApiStore.startCore()
      } catch (error: any) {
        message.error(error)
        console.error(error)
      }
    },
  },
  {
    label: 'profiles.copy',
    handler: (id: string) => {
      const p = deepClone(profilesStore.getProfileById(id)!)
      p.id = sampleID()
      p.name += '(Copy)'
      profilesStore.addProfile(p)
      message.success('common.success')
    },
  },
  {
    label: 'profiles.copytoClipboard',
    handler: async (id: string) => {
      const p = profilesStore.getProfileById(id)!
      try {
        const config = await generateConfig(p)
        const str = JSON.stringify(config, null, 2)
        const ok = await ClipboardSetText(str)
        if (!ok) {
          throw 'ClipboardSetText Error'
        }
        message.success('common.success')
      } catch (error: any) {
        message.error(error.message || error)
      }
    },
  },
  {
    label: 'profiles.generateAndView',
    handler: async (id: string) => {
      const p = profilesStore.getProfileById(id)!
      try {
        const config = await generateConfig(p)
        const m = modal({
          title: p.name,
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
    },
  },
  {
    label: 'profiles.editSourceFile',
    handler: (id: string) => {
      const profile = profilesStore.getProfileById(id)!
      const m = modal({ title: profile.name, width: '90', height: '90' })
      m.setContent(ProfileEditor, { profile }).open()
    },
  },
]

const generateMenus = (profile: Profile) => {
  const moreMenus: App.Menu[] = secondaryMenusList.map((v) => ({
    ...v,
    handler: () => v.handler?.(profile.id),
  }))
  const builtInMenus: App.Menu[] = [
    ...menuList.map((v) => ({ ...v, handler: () => v.handler?.(profile.id) })),
    {
      label: '',
      separator: true,
    },
    {
      label: 'common.more',
      children: moreMenus,
    },
  ]

  const contextMenus = pluginsStore.plugins.filter(
    (plugin) => Object.keys(plugin.context.profiles).length !== 0,
  )

  if (contextMenus.length !== 0) {
    moreMenus.push(
      {
        label: '',
        separator: true,
      },
      ...contextMenus.reduce((prev, plugin) => {
        const menus = Object.entries(plugin.context.profiles)
        return prev.concat(
          menus.map(([title, fn]) => {
            return {
              label: title,
              handler: async () => {
                try {
                  plugin.running = true
                  await pluginsStore.manualTrigger(plugin.id, fn as any, profile)
                } catch (error: any) {
                  message.error(error)
                } finally {
                  plugin.running = false
                }
              },
            }
          }),
        )
      }, [] as App.Menu[]),
    )
  }

  return builtInMenus
}

const handleShowProfileForm = (id?: string, step = 0) => {
  const m = modal({ title: id ? 'common.edit' : 'common.add', minWidth: '70' })
  m.setContent(ProfileForm, { id, step }).open()
}

const handleDeleteProfile = async (p: Profile) => {
  const { profile } = appSettingsStore.app.kernel
  if (profile === p.id && kernelApiStore.running) {
    message.warn('profiles.shouldStop')
    return
  }

  try {
    await profilesStore.deleteProfile(p.id)
  } catch (error: any) {
    console.error('deleteProfile:', error)
    message.error(error)
  }
}

const handleUseProfile = async (p: Profile) => {
  if (appSettingsStore.app.kernel.profile === p.id) {
    return
  }

  appSettingsStore.app.kernel.profile = p.id

  if (kernelApiStore.running) {
    await kernelApiStore.restartCore()
  }
}

const isCreatedBySubscription = (id: string) => {
  return !!subscribesStore.getSubscribeById(id)
}

const showAuto = () => alert('Tips', 'profile.auto')

const onSortUpdate = debounce(profilesStore.saveProfiles, 1000)
</script>

<template>
  <div v-if="profilesStore.profiles.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="profiles.empty" tag="div" scope="global" class="flex items-center mt-12">
          <template #action>
            <Button type="link" @click="handleShowProfileForm()">{{ t('common.add') }}</Button>
          </template>
        </I18nT>
        <div class="flex items-center">
          <CustomAction :actions="appStore.customActions.profiles_header" />
        </div>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio v-model="appSettingsStore.app.profilesView" :options="ViewOptions" class="mr-auto" />
    <CustomAction :actions="appStore.customActions.profiles_header" />
    <Button type="primary" icon="add" @click="handleShowProfileForm()">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[profilesStore.profiles, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="'grid-list-' + appSettingsStore.app.profilesView"
  >
    <Card
      v-for="p in profilesStore.profiles"
      :key="p.id"
      v-menu="generateMenus(p)"
      :title="p.name"
      :selected="appSettingsStore.app.kernel.profile === p.id"
      class="grid-list-item"
      @dblclick="handleUseProfile(p)"
    >
      <template #title-prefix>
        <Tag
          v-if="isCreatedBySubscription(p.id)"
          color="primary"
          size="small"
          style="margin-left: 0"
          @click="showAuto"
        >
          {{ t('common.auto') }}
        </Tag>
      </template>

      <template v-if="appSettingsStore.app.profilesView === View.Grid" #extra>
        <Dropdown>
          <Button type="link" size="small" icon="more" />
          <template #overlay>
            <div class="flex flex-col gap-4 min-w-64 p-4">
              <Button type="text" @click="handleUseProfile(p)">
                {{ t('common.use') }}
              </Button>
              <Button type="text" @click="handleShowProfileForm(p.id)">
                {{ t('common.edit') }}
              </Button>
              <Button type="text" @click="handleDeleteProfile(p)">
                {{ t('common.delete') }}
              </Button>
            </div>
          </template>
        </Dropdown>
      </template>

      <template v-else #extra>
        <Button type="text" size="small" @click="handleUseProfile(p)">
          {{ t('common.use') }}
        </Button>
        <Button type="text" size="small" @click="handleShowProfileForm(p.id)">
          {{ t('common.edit') }}
        </Button>
        <Button type="text" size="small" @click="handleDeleteProfile(p)">
          {{ t('common.delete') }}
        </Button>
      </template>
      <div>
        {{ t('profiles.inbounds') }}
        :
        {{ p.inbounds.length }}
        /
        {{ t('profiles.outbounds') }}
        :
        {{ p.outbounds.length }}
      </div>
      <div>
        {{ t('kernel.route.tab.rule_set') }}
        :
        {{ p.route.rule_set.length }}
        /
        {{ t('kernel.route.tab.rules') }}
        :
        {{ p.route.rules.length }}
      </div>
      <div>
        {{ t('profiles.dnsServers') }}
        :
        {{ p.dns.servers.length }}
        /
        {{ t('profiles.dnsRules') }}
        :
        {{ p.dns.rules.length }}
      </div>
    </Card>
  </div>
</template>
