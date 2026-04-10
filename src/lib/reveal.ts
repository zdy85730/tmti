import type { BrandRevealState } from '../types'

export const DRAFT_REVEAL_MS = 1000
export const META_REVEAL_MS = 1800
export const DEFAULT_EXPORT_MODE = 'cover' as const

const revealOrder: Record<BrandRevealState, number> = {
  tmti: 0,
  'draft-peek': 1,
  'meta-visible': 2,
}

export function deriveBrandRevealState(elapsedMs: number, forceMeta = false): BrandRevealState {
  if (forceMeta || elapsedMs >= META_REVEAL_MS) {
    return 'meta-visible'
  }

  if (elapsedMs >= DRAFT_REVEAL_MS) {
    return 'draft-peek'
  }

  return 'tmti'
}

export function getHigherRevealState(
  current: BrandRevealState,
  candidate: BrandRevealState,
): BrandRevealState {
  return revealOrder[candidate] > revealOrder[current] ? candidate : current
}
