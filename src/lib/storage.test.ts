import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGeneratedQuiz, buildGeneratorProfile } from './quiz'
import { clearGeneratedQuizSession, loadGeneratedQuizSession, saveGeneratedQuizSession } from './storage'

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
}

describe('generated quiz session storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('round-trips the last generated quiz and builder answers', () => {
    const answers = {
      family: 'boundary',
      scene: 'work',
      tone: 'soft',
      titleStyle: 'essay',
      rhythm: 'scene',
      themeToken: 'linen',
    }
    const definition = buildGeneratedQuiz(buildGeneratorProfile(answers))

    saveGeneratedQuizSession(definition, answers)
    const restored = loadGeneratedQuizSession()

    expect(restored).not.toBeNull()
    expect(restored?.definition.id).toBe(definition.id)
    expect(restored?.builderAnswers.family).toBe('boundary')
    expect(restored?.definition.questions).toHaveLength(10)
  })

  it('clears the stored session', () => {
    const definition = buildGeneratedQuiz(
      buildGeneratorProfile({
        family: 'stability',
        scene: 'work',
        tone: 'clean',
        titleStyle: 'plain',
        rhythm: 'judgment',
        themeToken: 'moss',
      }),
    )

    saveGeneratedQuizSession(definition, { family: 'stability' })
    clearGeneratedQuizSession()

    expect(loadGeneratedQuizSession()).toBeNull()
  })
})
