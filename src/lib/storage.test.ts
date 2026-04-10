import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadResultSession } from './storage'

class MemoryStorage {
  private store = new Map<string, string>()

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

describe('loadResultSession', () => {
  beforeEach(() => {
    const storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)
  })

  it('migrates legacy snapshots with draft residue lines into the new structure', () => {
    localStorage.setItem(
      'tmti:last-result',
      JSON.stringify({
        axisScores: { public: 12, exposure: 10, boundary: 13, stability: 12 },
        axisLevels: { public: 2, exposure: 2, boundary: 3, stability: 2 },
        publicType: {
          code: 'STEADY',
          name: '稳场派',
          shortDefinition: '先把场面稳住。',
          subtitle: '分寸在线。',
          motif: 'frame',
          themeToken: 'ember',
          target: { public: 3, exposure: 2, boundary: 3, stability: 3 },
          acceptedDescriptors: ['克制', '边界清楚', '说法稳当'],
          withheldDescriptors: ['会被气氛影响', '在意回应速度', '不想显得太需要'],
        },
        draftResidue: {
          lines: ['怕被误解', '想确认关系', '需要回应'],
          marginNote: '保留',
        },
        traceNotes: [{ text: '顺手表达被更早选中' }],
        brandRevealState: 'tmti',
        defaultExportMode: 'cover',
      }),
    )

    const { snapshot } = loadResultSession()

    expect(snapshot).not.toBeNull()
    expect(snapshot?.coverWords).toEqual(['克制', '边界清楚', '说法稳当'])
    expect(snapshot?.candidatePool[0]?.code).toBe('STEADY')
    expect(snapshot?.selectedCover.code).toBe('STEADY')
    expect(snapshot?.residueMarks[0]?.text).toBe('怕被误解')
    expect(snapshot?.residueMarks[0]?.strike).toBe(true)
  })
})
