import type { BrandRevealEvent, BrandRevealState } from '../types'

export const DEFAULT_EXPORT_MODE = 'cover' as const

export function transitionBrandRevealState(
  current: BrandRevealState,
  event: BrandRevealEvent,
): BrandRevealState {
  if (current === 'meta-visible') {
    return current
  }

  if (event === 'select-trace-export' || event === 'attempt-share') {
    return 'meta-visible'
  }

  if ((event === 'peek-draft' || event === 'inspect-preview') && current === 'tmti') {
    return 'draft-peek'
  }

  return current
}
