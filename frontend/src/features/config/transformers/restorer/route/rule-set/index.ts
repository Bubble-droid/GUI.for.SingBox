import { DefaultRouteRuleset } from '@/constant'
import { RuleSetType } from '@/enums'
import { useEnvStore, useRulesetsStore } from '@/stores'

import type { RuleSetConfig } from '@/features/config/types'

export const restoreRouteRuleset = (
  rulesets: Recordable[],
  RouteRuleSetIds: Recordable,
  OutboundsIds: Recordable,
): RuleSetConfig[] => {
  const { env } = useEnvStore()
  const rulesetsStore = useRulesetsStore()
  return rulesets.flatMap((raw) => {
    const ruleset = DefaultRouteRuleset()
    ruleset.id = RouteRuleSetIds[raw.tag]
    ruleset.type = raw.type
    ruleset.tag = raw.tag

    if (raw.type === RuleSetType.Inline) {
      if ('rules' in raw) {
        ruleset.rules = JSON.stringify(raw.rules, null, 2)
      }
    } else if (raw.type === RuleSetType.Local) {
      if ('path' in raw) {
        const r = rulesetsStore.rulesets.find(
          (v) => v.path === raw.path.replace(`${env.appDataPath}/`, 'data/'),
        )
        if (r) {
          ruleset.path = r.id
        } else {
          ruleset.path = raw.path
        }
      }
      if ('format' in raw) {
        ruleset.format = raw.format
      }
    } else if (raw.type === RuleSetType.Remote) {
      if ('format' in raw) {
        ruleset.format = raw.format
      }
      if ('url' in raw) {
        ruleset.url = raw.url
      }
      if ('download_detour' in raw) {
        ruleset.download_detour = OutboundsIds[raw.download_detour]
      }
      if ('update_interval' in raw) {
        ruleset.update_interval = raw.update_interval
      }
    }
    return ruleset
  })
}
