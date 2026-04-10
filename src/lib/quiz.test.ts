import { describe, expect, it } from 'vitest'
import { buildGeneratedQuiz, buildGeneratorProfile, computeGeneratedQuizResult, decodeQuizToken, encodeQuizToken, validateContentModel } from './quiz'

const builderAnswers = {
  family: 'response',
  scene: 'game',
  tone: 'clean',
  titleStyle: 'plain',
  rhythm: 'scene',
  themeToken: 'berry',
}

describe('TMTI quiz generation', () => {
  it('builds the same quiz for the same generator answers', () => {
    const profileA = buildGeneratorProfile(builderAnswers)
    const profileB = buildGeneratorProfile(builderAnswers)
    const quizA = buildGeneratedQuiz(profileA)
    const quizB = buildGeneratedQuiz(profileB)

    expect(quizA.id).toBe(quizB.id)
    expect(quizA.questionIds).toEqual(quizB.questionIds)
    expect(quizA.title).toBe(quizB.title)
    expect(quizA.questions).toHaveLength(10)
  })

  it('round-trips quiz tokens into the same definition', () => {
    const quiz = buildGeneratedQuiz(buildGeneratorProfile(builderAnswers))
    const restored = decodeQuizToken(encodeQuizToken(quiz))

    expect(restored).not.toBeNull()
    expect(restored?.id).toBe(quiz.id)
    expect(restored?.questionIds).toEqual(quiz.questionIds)
    expect(restored?.title).toBe(quiz.title)
  })

  it('computes a valid second-order result for a full answer set', () => {
    const quiz = buildGeneratedQuiz(buildGeneratorProfile(builderAnswers))
    const answers = Object.fromEntries(quiz.questions.map((question) => [question.id, question.options[0]?.id ?? 'a']))
    const result = computeGeneratedQuizResult(answers, quiz)

    expect(result.outcome.nickname.length).toBeGreaterThan(0)
    expect(Object.keys(result.axisScores)).toHaveLength(2)
    expect(Object.values(result.axisPercentages).every((score) => score >= 0 && score <= 100)).toBe(true)
  })

  it('keeps the bundled content model internally consistent', () => {
    expect(validateContentModel()).toEqual([])
  })
})
