import { describe, expect, it } from 'vitest'
import { DEFAULT_EXPORT_MODE, transitionBrandRevealState } from './reveal'

describe('reveal state', () => {
  it('keeps the default export mode on cover only', () => {
    expect(DEFAULT_EXPORT_MODE).toBe('cover')
  })

  it('reveals draft and meta only through events', () => {
    expect(transitionBrandRevealState('tmti', 'peek-draft')).toBe('draft-peek')
    expect(transitionBrandRevealState('tmti', 'inspect-preview')).toBe('draft-peek')
    expect(transitionBrandRevealState('draft-peek', 'attempt-share')).toBe('meta-visible')
    expect(transitionBrandRevealState('draft-peek', 'select-trace-export')).toBe('meta-visible')
    expect(transitionBrandRevealState('meta-visible', 'peek-draft')).toBe('meta-visible')
  })
})
