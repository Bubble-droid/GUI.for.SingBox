import type { RuleSetType, RuleSetFormat } from '@/features/config/constant'
import type { TagItem } from '@/features/config/types'

export interface RuleSetConfig extends TagItem {
  type: RuleSetType
  // inline
  rules: string
  // local
  path: string
  // remote
  url: string
  download_detour: string
  update_interval: string
  // local or remote
  format: RuleSetFormat
}
