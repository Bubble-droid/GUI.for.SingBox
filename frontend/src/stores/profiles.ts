// oxlint-disable unicorn/consistent-function-scoping
import { createProfile } from '@defaults'
import type { Profile } from '@profiles'
import { restoreProfile } from '@restorer'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { parse } from 'yaml'

import { FileExists, ReadFile, WriteFile } from '@/bridge/io'

import { ProfilesFilePath } from '@/constant/app'
import { eventBus } from '@/utils/eventBus'
import { migrateProfiles } from '@/utils/migration'
import { ignoredError, stringifyNoFolding } from '@/utils/others'

import { StoreDep, useStoreDeps } from './deps'

export const useProfilesStore = defineStore('profiles', () => {
  const appSettingsStore = useStoreDeps(StoreDep.AppSettingsStore)

  const profiles = ref<Profile[]>([])
  const currentProfile = computed(() => getProfileById(appSettingsStore.app.kernel.profile))

  const setupProfiles = async () => {
    const data = await ignoredError(ReadFile, ProfilesFilePath)
    data && (profiles.value = parse(data))

    await migrateProfiles(profiles.value, saveProfiles)
  }

  const saveProfiles = () => {
    return WriteFile(ProfilesFilePath, stringifyNoFolding(profiles.value))
  }

  const addProfile = async (p: Profile) => {
    profiles.value.push(p)
    try {
      await saveProfiles()
    } catch (error) {
      const idx = profiles.value.indexOf(p)
      if (idx !== -1) {
        profiles.value.splice(idx, 1)
      }
      throw error
    }
  }

  const deleteProfile = async (id: string) => {
    const idx = profiles.value.findIndex((v) => v.id === id)
    if (idx === -1) {
      return
    }
    const backup = profiles.value.splice(idx, 1)[0]!
    try {
      await saveProfiles()
    } catch (error) {
      profiles.value.splice(idx, 0, backup)
      throw error
    }

    eventBus.emit('profileChange', { id })
  }

  const editProfile = async (id: string, p: Profile) => {
    const idx = profiles.value.findIndex((v) => v.id === id)
    if (idx === -1) {
      return
    }
    const backup = profiles.value.splice(idx, 1, p)[0]!
    try {
      await saveProfiles()
    } catch (error) {
      profiles.value.splice(idx, 1, backup)
      throw error
    }

    eventBus.emit('profileChange', { id })
  }

  const importProfile = async (path: string) => {
    if (!(await FileExists(path))) {
      throw new Error('No such file')
    }
    const content = await ReadFile(path)
    const raw = JSON.parse(content)
    const name = path.split('/').pop()
    const profile = restoreProfile(raw, name)
    await addProfile(profile)
  }

  const getProfileById = (id: string) => profiles.value.find((v) => v.id === id)

  const getProfileTemplate = (name = ''): Profile => createProfile(name)

  return {
    profiles,
    currentProfile,
    setupProfiles,
    saveProfiles,
    addProfile,
    editProfile,
    importProfile,
    deleteProfile,
    getProfileById,
    getProfileTemplate,
  }
})
