import { describe, expect, it } from 'vitest'
import { DEFAULT_EXPORT_MODE, DRAFT_REVEAL_MS, META_REVEAL_MS, deriveBrandRevealState } from './reveal'

describe('reveal timing', () => {
  it('keeps the default export mode on cover only', () => {
    expect(DEFAULT_EXPORT_MODE).toBe('cover')
  })

  it('reveals META-TI only after the draft card timing threshold', () => {
    expect(deriveBrandRevealState(DRAFT_REVEAL_MS - 1)).toBe('tmti')
    expect(deriveBrandRevealState(DRAFT_REVEAL_MS)).toBe('draft-peek')
    expect(deriveBrandRevealState(META_REVEAL_MS - 1)).toBe('draft-peek')
    expect(deriveBrandRevealState(META_REVEAL_MS)).toBe('meta-visible')
  })
})
