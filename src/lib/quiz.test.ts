import { describe, expect, it } from 'vitest'
import { questions } from '../data/questions'
import { publicTypeProfiles } from '../data/publicTypes'
import { computeResult } from './quiz'

function answersFromTarget(target: { public: 1 | 2 | 3; exposure: 1 | 2 | 3; boundary: 1 | 2 | 3; stability: 1 | 2 | 3 }) {
  return Object.fromEntries(questions.map((question) => [question.id, target[question.axis]]))
}

describe('computeResult', () => {
  it('maps axis targets to the expected public type', () => {
    const steady = publicTypeProfiles.find((profile) => profile.code === 'STEADY')

    expect(steady).toBeDefined()

    const snapshot = computeResult(answersFromTarget(steady!.target))

    expect(snapshot.publicType.code).toBe('STEADY')
    expect(snapshot.defaultExportMode).toBe('cover')
  })

  it('builds draft fragments and trace notes from mirror bias plus exposure avoidance', () => {
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

    expect(snapshot.draftResidue.lines.length).toBeGreaterThanOrEqual(2)
    expect(snapshot.draftResidue.lines.length).toBeLessThanOrEqual(4)
    expect(snapshot.draftResidue.lines.some((line) => line.includes('更容易公开认领'))).toBe(true)
    expect(snapshot.draftResidue.lines.some((line) => line.includes('需要回应'))).toBe(true)
    expect(snapshot.traceNotes.some((note) => note.text.includes('顺口'))).toBe(true)
  })
})
