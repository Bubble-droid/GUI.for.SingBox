<script setup lang="ts">
import { createRouteRuleset, createRouteRule } from '@defaults/route.ts'
import { RuleSetFormat, RouteRuleType, RuleSetType } from '@features/constant/kernel.ts'
import { computed } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { OpenURI, RemoveFile, WriteFile } from '@/bridge/io.ts'

import { DraggableOptions, ViewOptions } from '@/constant/app'
import { View } from '@/constant/app.ts'
import { BuiltInOutbound, EmptyRuleSet } from '@/constant/kernel'
import { useAppSettingsStore } from '@/stores/appSettings.ts'
import { useProfilesStore } from '@/stores/profiles.ts'
import { useRulesetsStore } from '@/stores/rulesets.ts'
import { formatDate, formatRelativeTime } from '@/utils/format.ts'
import { modal, message, picker } from '@/utils/interaction.ts'
import { ignoredError, deepClone, debounce } from '@/utils/others.ts'

import type { App } from '@/types'

import RulesetForm from './components/RulesetForm.vue'
import RulesetHub from './components/RulesetHub.vue'
import RulesetView from './components/RulesetView.vue'

const sourceMenuList: App.Menu[] = [
  {
    label: 'rulesets.editRuleset',
    handler: (id: string) => handleEditRulesetList(id),
  },
  {
    label: 'common.openFile',
    handler: async (id: string) => {
      const ruleset = rulesetsStore.getRulesetById(id)
      await OpenURI(ruleset!.path)
    },
  },
  {
    label: 'common.clear',
    handler: (id: string) => handleClearRuleset(id),
  },
]

const { t } = useI18n()
const rulesetsStore = useRulesetsStore()
const appSettingsStore = useAppSettingsStore()
const profilesStore = useProfilesStore()

const handleImportRuleset = () => {
  const m = modal({
    title: 'rulesets.hub',
    cancelText: 'common.close',
    height: '90',
    width: '90',
    px: 0,
    py: 0,
    submit: false,
    maskClosable: true,
  })
  m.setContent(RulesetHub).open()
}

const handleShowRulesetForm = (id?: string, isUpdate = false) => {
  const m = modal({
    title: isUpdate ? 'common.edit' : 'common.add',
    maxHeight: '90',
    minWidth: '70',
  })
  m.setContent(RulesetForm, { id, isUpdate }).open()
}

const handleUpdateRulesets = async () => {
  try {
    await rulesetsStore.updateRulesets()
    message.success('common.success')
  } catch (error: any) {
    console.error('updateRulesets:', error)
    message.error(error)
  }
}

const handleEditRulesetList = (id: string) => {
  const m = modal({
    title: rulesetsStore.getRulesetById(id)?.name,
    height: '90',
    width: '90',
  })
  m.setContent(RulesetView, { id }).open()
}

const handleUpdateRuleset = async (r: App.RuleSet) => {
  try {
    await rulesetsStore.updateRuleset(r.id)
  } catch (error: any) {
    console.error('updateRuleset:', error)
    message.error(error)
  }
}

const handleDeleteRuleset = async (r: App.RuleSet) => {
  try {
    await ignoredError(RemoveFile, r.path)
    await rulesetsStore.deleteRuleset(r.id)
  } catch (error: any) {
    console.error('deleteRuleset:', error)
    message.error(error)
  }
}

const handleDisableRuleset = (r: App.RuleSet) => {
  r.disabled = !r.disabled
  rulesetsStore.editRuleset(r.id, r)
}

const handleClearRuleset = async (id: string) => {
  const r = rulesetsStore.getRulesetById(id)
  if (!r) {
    return
  }
  if (r.format != RuleSetFormat.Source) {
    return
  }

  try {
    await WriteFile(r.path, JSON.stringify(EmptyRuleSet, null, 2))
    rulesetsStore.editRuleset(r.id, r)
  } catch (error: any) {
    message.error(error)
    console.error(error)
  }
}

const handleAddRulesetToProfile = async (id: string) => {
  const ruleset = rulesetsStore.getRulesetById(id)
  if (!ruleset) {
    return
  }

  try {
    const { items } = await picker.resource('profile', 'profiles.select', { max: 1, min: 1 })
    const profile = items[0]
    if (!profile) {
      return
    }

    const insertionPointIndex = profile.route.rules.findIndex(
      (rule) => rule.type === RouteRuleType.InsertionPoint,
    )

    if (insertionPointIndex === -1) {
      message.warn('kernel.missingInsertionPoint')
      return
    }

    const profileRuleset = profile.route.rule_set.find(
      (item) => item.type === RuleSetType.Local && item.path === ruleset.id,
    )
    if (
      profileRuleset &&
      profile.route.rules.some(
        (rule) =>
          rule.type === RouteRuleType.RuleSet &&
          rule.payload.split(',').includes(profileRuleset.id),
      )
    ) {
      message.info('common.added')
      return
    }

    const outboundOptions = [
      ...BuiltInOutbound.map((outbound) => ({ label: outbound, value: outbound })),
      ...profile.outbounds.map((outbound) => ({
        label: outbound.tag,
        value: outbound.id,
        description: outbound.type,
      })),
    ]
    const target = await picker.single('kernel.route.rules.outbound', outboundOptions, [
      profile.outbounds[0]?.id || BuiltInOutbound[0]!,
    ])

    if (!target) {
      return
    }

    const nextProfile = deepClone(profile)
    let rulesetReferenceId = profileRuleset?.id
    if (!rulesetReferenceId) {
      const rulesetReference = {
        ...createRouteRuleset(),
        tag: ruleset.name,
        format: ruleset.format,
        path: ruleset.id,
      }
      nextProfile.route.rule_set.unshift(rulesetReference)
      rulesetReferenceId = rulesetReference.id
    }

    nextProfile.route.rules.splice(insertionPointIndex + 1, 0, {
      ...createRouteRule(),
      payload: rulesetReferenceId,
      outbound: target,
    })

    await profilesStore.editProfile(nextProfile.id, nextProfile)
    message.success('common.success')
  } catch (error) {
    message.error(error)
  }
}

const generateMenus = (r: App.RuleSet) => {
  const addToProfileMenu: App.Menu = {
    label: 'rulesets.addToProfile',
    handler: (id: string) => handleAddRulesetToProfile(id),
  }

  return {
    [RuleSetFormat.Source]: [addToProfileMenu, ...sourceMenuList],
    [RuleSetFormat.Binary]: [addToProfileMenu],
  }[r.format].map((v) => ({ ...v, handler: () => v.handler?.(r.id) }))
}

const noUpdateNeeded = computed(() => rulesetsStore.rulesets.every((v) => v.disabled))

const onSortUpdate = debounce(rulesetsStore.saveRulesets, 1000)
</script>

<template>
  <div v-if="rulesetsStore.rulesets.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="rulesets.empty" tag="div" scope="global" class="flex items-center mt-12">
          <template #action>
            <Button type="link" @click="handleShowRulesetForm()">{{ t('common.add') }}</Button>
          </template>
          <template #import>
            <Button type="link" @click="handleImportRuleset">{{ t('rulesets.hub') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio v-model="appSettingsStore.app.rulesetsView" :options="ViewOptions" class="mr-auto" />
    <Button type="link" @click="handleImportRuleset">
      {{ t('rulesets.hub') }}
    </Button>
    <Button
      :disabled="noUpdateNeeded"
      :type="noUpdateNeeded ? 'text' : 'link'"
      @click="handleUpdateRulesets"
    >
      {{ t('common.updateAll') }}
    </Button>
    <Button type="primary" icon="add" class="ml-16" @click="handleShowRulesetForm()">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[rulesetsStore.rulesets, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="'grid-list-' + appSettingsStore.app.rulesetsView"
  >
    <Card
      v-for="r in rulesetsStore.rulesets"
      :key="r.id"
      v-menu="generateMenus(r)"
      :title="r.name"
      :disabled="r.disabled"
      class="grid-list-item"
    >
      <template #title-prefix>
        <Tag v-if="r.updating" color="cyan" size="small">
          {{ t('ruleset.updating') }}
        </Tag>
      </template>

      <template v-if="appSettingsStore.app.rulesetsView === View.Grid" #extra>
        <Dropdown>
          <Button type="link" size="small" icon="more" />
          <template #overlay>
            <div class="flex flex-col gap-4 min-w-64 p-4">
              <Button
                :disabled="r.disabled"
                :loading="r.updating"
                :type="r.disabled ? 'text' : 'text'"
                @click="handleUpdateRuleset(r)"
              >
                {{ t('common.update') }}
              </Button>
              <Button type="text" @click="handleDisableRuleset(r)">
                {{ r.disabled ? t('common.enable') : t('common.disable') }}
              </Button>
              <Button type="text" @click="handleShowRulesetForm(r.id, true)">
                {{ t('common.edit') }}
              </Button>
              <Button type="text" @click="handleDeleteRuleset(r)">
                {{ t('common.delete') }}
              </Button>
            </div>
          </template>
        </Dropdown>
      </template>

      <template v-else #extra>
        <Button
          :disabled="r.disabled"
          :loading="r.updating"
          :type="r.disabled ? 'text' : 'text'"
          size="small"
          @click="handleUpdateRuleset(r)"
        >
          {{ t('common.update') }}
        </Button>
        <Button type="text" size="small" @click="handleDisableRuleset(r)">
          {{ r.disabled ? t('common.enable') : t('common.disable') }}
        </Button>
        <Button type="text" size="small" @click="handleShowRulesetForm(r.id, true)">
          {{ t('common.edit') }}
        </Button>
        <Button type="text" size="small" @click="handleDeleteRuleset(r)">
          {{ t('common.delete') }}
        </Button>
      </template>

      <div v-if="r.format === RuleSetFormat.Binary">
        {{ t('ruleset.format.name') }}
        :
        {{ r.format || '--' }}
      </div>

      <template v-if="appSettingsStore.app.rulesetsView === View.Grid">
        <div v-if="r.format === RuleSetFormat.Source">
          {{ t('rulesets.rulesetCount') }}
          :
          {{ r.count }}
        </div>
        <div>
          {{ t('common.updateTime') }}
          :
          {{ r.updateTime ? formatRelativeTime(r.updateTime) : '--' }}
        </div>
      </template>
      <template v-else>
        <div v-if="r.format === RuleSetFormat.Source">
          {{ t('rulesets.rulesetCount') }}
          :
          {{ r.count }}
        </div>
        <div>
          {{ t('common.updateTime') }}
          :
          {{ r.updateTime ? formatDate(r.updateTime, 'YYYY-MM-DD HH:mm:ss') : '--' }}
        </div>
      </template>
    </Card>
  </div>
</template>
