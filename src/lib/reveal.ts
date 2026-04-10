import type { BrandRevealEvent, BrandRevealState } from '../types'

export const DEFAULT_EXPORT_MODE = 'cover' as const

export function transitionBrandRevealState(
  current: BrandRevealState,
  event: BrandRevealEvent,
): BrandRevealState {
  if (event === 'select-trace-export') {
    return 'meta-visible'
  }

  if (event === 'peek-draft' && current === 'tmti') {
    return 'draft-peek'
  }

  return current
}
