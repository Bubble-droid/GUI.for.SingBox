import { createProfile, ProfileSchemaVersion } from '@defaults'
import { generateConfig } from '@generator'
import type { Profile } from '@profiles'
import { restoreProfile } from '@restorer'

import { RequestProxyMode } from '@/enums/app'

import { legacyGenerateConfig } from './generator'
import { normalizeErrorMessage } from './normalize'
import { deepAssign } from './others'

export const migrateProfiles = async (
  profiles: (Profile | App.Profile)[],
  save: () => Promise<string>,
) => {
  let needSync = false

  profiles.forEach((profile) => {
    profile.dns.rules.forEach((rule) => {
      if (typeof rule.enable === 'undefined') {
        rule.enable = true
        needSync = true
      }
    })
    profile.route.rules.forEach((rule) => {
      if (typeof rule.enable === 'undefined') {
        rule.enable = true
        needSync = true
      }
    })
  })

  const getSubIds = (profile: Profile | App.Profile) => {
    return profile.outbounds.reduce((p, c) => {
      c.outbounds.forEach((outbound) => {
        if (outbound.type !== 'Built-in') {
          const id = outbound.type === 'Subscription' ? outbound.id : outbound.type
          p.add(id)
        }
      })
      return p
    }, new Set<string>())
  }

  const template = createProfile()

  for (const [i, p] of profiles.entries()) {
    const subIds = getSubIds(p)
    try {
      if (!('schema' in p)) {
        const newConfig = await legacyGenerateConfig(p)
        const newProfile = restoreProfile(newConfig, p.name, {
          profile: p,
          subscriptionIds: [...subIds],
        })

        profiles[i] = newProfile
        needSync = true
        continue
      }

      if (p.schema !== ProfileSchemaVersion) {
        const newConfig = await generateConfig(deepAssign(template, p))
        const newProfile = restoreProfile(newConfig, p.name, {
          profile: p,
          subscriptionIds: [...subIds],
        })
        profiles[i] = newProfile
        needSync = true
      }
    } catch (error) {
      const msg = `Failed to migrate profile [${p.name || p.id}]: ${normalizeErrorMessage(error)}`
      console.error(msg)
      throw error
    }
  }

  if (needSync) await save()
}

export const migrateSubscribes = async (
  subscribes: App.Subscription[],
  save: () => Promise<string>,
) => {
  let needSync = false

  subscribes.forEach((subscribe) => {
    if (typeof subscribe.requestProxyMode === 'undefined') {
      subscribe.requestProxyMode = RequestProxyMode.System
      needSync = true
    }
    if (typeof subscribe.customProxy === 'undefined') {
      subscribe.customProxy = ''
      needSync = true
    }
  })

  if (needSync) await save()
}

export const migrateRulesets = async (rulesets: App.RuleSet[], save: () => Promise<string>) => {
  let needSync = false

  rulesets.forEach((ruleset) => {
    const legacyRuleset = ruleset as App.RuleSet & { tag?: string }

    if (typeof ruleset.name === 'undefined' && legacyRuleset.tag) {
      ruleset.name = legacyRuleset.tag
      delete legacyRuleset.tag
      needSync = true
    }
  })

  if (needSync) await save()
}
