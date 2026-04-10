import { describe, expect, it } from 'vitest'
import { questions } from '../data/questions'
import { publicTypeProfiles } from '../data/publicTypes'
import { computeResult } from './quiz'

function answersFromTarget(target: { public: 1 | 2 | 3; exposure: 1 | 2 | 3; boundary: 1 | 2 | 3; stability: 1 | 2 | 3 }) {
  return Object.fromEntries(questions.map((question) => [question.id, target[question.axis]]))
}

describe('computeResult', () => {
  it('keeps a candidate pool and still picks the expected cover type for a clean target', () => {
    const steady = publicTypeProfiles.find((profile) => profile.code === 'STEADY')

    expect(steady).toBeDefined()

    const snapshot = computeResult(answersFromTarget(steady!.target))

    expect(snapshot.selectedCover.code).toBe('STEADY')
    expect(snapshot.candidatePool.length).toBe(3)
    expect(snapshot.candidatePool[0]?.code).toBe('STEADY')
    expect(snapshot.coverWords.length).toBeGreaterThanOrEqual(3)
    expect(snapshot.defaultExportMode).toBe('cover')
  })

  it('surfaces conflicts, cut words, and residue from mirror plus exposure answers', () => {
    const answers = answersFromTarget({
      public: 2,
      exposure: 3,
      boundary: 2,
      stability: 2,
    })

    answers.q1 = 1
    answers.q2 = 1
    answers.q3 = 1
    answers.q4 = 2
    answers.q13 = 3
    answers.q14 = 3
    answers.q15 = 3
    answers.q16 = 3

    const snapshot = computeResult(answers)

    expect(snapshot.conflictEvidence.length).toBeGreaterThan(0)
    expect(snapshot.conflictEvidence.some((entry) => entry.before.includes('留白'))).toBe(true)
    expect(snapshot.cutWords.some((word) => word.includes('需要被确认') || word.includes('想确认关系'))).toBe(true)
    expect(snapshot.residueMarks.length).toBeGreaterThanOrEqual(4)
    expect(snapshot.residueMarks.some((mark) => mark.tone === 'cut' && mark.strike)).toBe(true)
    expect(snapshot.traceNotes.some((note) => note.text.includes('->'))).toBe(true)
  })
})
