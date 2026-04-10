import { publicTypeProfiles } from '../data/publicTypes'
import { questionOutcomeMap } from '../data/questionOutcomes'
import { questions } from '../data/questions'
import { DEFAULT_EXPORT_MODE } from './reveal'
import type {
  AxisId,
  ConflictEvidence,
  DraftResidue,
  PublicTypeProfile,
  QuizQuestion,
  QuizValue,
  ResultCandidate,
  ResultSnapshot,
  TraceNote,
} from '../types'

type TokenWeights = Record<string, number>

interface RankedCandidate extends ResultCandidate {
  profile: PublicTypeProfile
}

function scoreToLevel(score: number): QuizValue {
  if (score <= 9) {
    return 1
  }

  if (score <= 13) {
    return 2
  }

  return 3
}

function buildAxisScores(answers: Record<string, number>) {
  return questions.reduce<Record<AxisId, number>>(
    (scores, question) => {
      scores[question.axis] += Number(answers[question.id] ?? 0)
      return scores
    },
    {
      public: 0,
      exposure: 0,
      boundary: 0,
      stability: 0,
    },
  )
}

function buildAxisLevels(axisScores: Record<AxisId, number>) {
  return Object.entries(axisScores).reduce<Record<AxisId, QuizValue>>((levels, [axis, score]) => {
    levels[axis as AxisId] = scoreToLevel(score)
    return levels
  }, {} as Record<AxisId, QuizValue>)
}

function addTokens(bucket: TokenWeights, tokens: string[] | undefined, weight = 1) {
  if (!tokens?.length) {
    return
  }

  tokens.forEach((token) => {
    bucket[token] = (bucket[token] ?? 0) + weight
  })
}

function pickEvidenceWord(questionId: string, answer: QuizValue) {
  const outcome = questionOutcomeMap[questionId]

  if (!outcome) {
    return null
  }

  return outcome.cutTokens?.[answer]?.[0] ?? outcome.coverTokens?.[answer]?.[0] ?? null
}

function collectOutcomeTokens(answers: Record<string, number>) {
  const coverWeights: TokenWeights = {}
  const cutWeights: TokenWeights = {}
  let coverPriority = 0

  questions.forEach((question) => {
    const answer = answers[question.id] as QuizValue | undefined

    if (!answer) {
      return
    }

    const outcome = questionOutcomeMap[question.id]

    if (!outcome) {
      return
    }

    const priority = outcome.priorityWeights?.[answer] ?? 0
    coverPriority += priority

    addTokens(coverWeights, outcome.coverTokens?.[answer], Math.max(1, priority))
    addTokens(cutWeights, outcome.cutTokens?.[answer], 1)
  })

  return {
    coverWeights,
    cutWeights,
    coverPriority,
  }
}

function buildConflictEvidence(answers: Record<string, number>): ConflictEvidence[] {
  return questions
    .filter((question) => question.mirrorOf)
    .flatMap((question) => {
      const original = answers[question.mirrorOf!] as QuizValue | undefined
      const mirrored = answers[question.id] as QuizValue | undefined

      if (!original || !mirrored || original === mirrored) {
        return []
      }

      const before = pickEvidenceWord(question.mirrorOf!, original)
      const after = pickEvidenceWord(question.id, mirrored)

      if (!before || !after) {
        return []
      }

      const severity: ConflictEvidence['severity'] = Math.abs(mirrored - original) >= 2 ? 'hard' : 'soft'

      return [
        {
          cue: questionOutcomeMap[question.id]?.conflictCue ?? '答案改写',
          before,
          after,
          severity,
        },
      ]
    })
    .slice(0, 4)
}

function buildCandidatePool(
  levels: Record<AxisId, QuizValue>,
  coverWeights: TokenWeights,
  cutWeights: TokenWeights,
  conflicts: ConflictEvidence[],
  coverPriority: number,
): RankedCandidate[] {
  const hardConflictCount = conflicts.filter((conflict) => conflict.severity === 'hard').length

  return [...publicTypeProfiles]
    .map((profile) => {
      const distance =
        Math.abs(profile.target.public - levels.public) +
        Math.abs(profile.target.exposure - levels.exposure) +
        Math.abs(profile.target.boundary - levels.boundary) +
        Math.abs(profile.target.stability - levels.stability)

      const coverFit = profile.acceptedDescriptors.reduce((total, word) => total + (coverWeights[word] ?? 0), 0)
      const shadowFit = profile.withheldDescriptors.reduce((total, word) => total + (cutWeights[word] ?? 0), 0)

      let tensionFit = 0

      if (profile.code === 'MIRROR') {
        tensionFit += conflicts.length * 8
      }

      if (profile.code === 'ECHO') {
        tensionFit += hardConflictCount * 6
      }

      if (profile.code === 'FRAME') {
        tensionFit += (coverWeights['顺手体面'] ?? 0) * 4
      }

      if (profile.code === 'STEADY') {
        tensionFit += (coverWeights['边界清楚'] ?? 0) * 4
      }

      if (profile.code === 'CLEAR') {
        tensionFit += (coverWeights['清楚'] ?? 0) * 4
      }

      if (profile.code === 'VEIL') {
        tensionFit += (coverWeights['留白'] ?? 0) * 4
      }

      if (profile.code === 'BUFFER') {
        tensionFit += (coverWeights['好接近'] ?? 0) * 4
      }

      if (profile.code === 'LATE') {
        tensionFit += (coverWeights['会先观察'] ?? 0) * 4
      }

      const score = 96 - distance * 14 + coverFit * 6 + shadowFit * 3 + tensionFit + coverPriority
      const reasonWords = Array.from(
        new Set([
          ...profile.acceptedDescriptors.filter((word) => (coverWeights[word] ?? 0) > 0),
          ...profile.withheldDescriptors.filter((word) => (cutWeights[word] ?? 0) > 0),
        ]),
      )

      return {
        code: profile.code,
        name: profile.name,
        score,
        reasonWords: reasonWords.length ? reasonWords.slice(0, 3) : profile.acceptedDescriptors.slice(0, 3),
        profile,
      }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
}

function pickCoverWords(profile: PublicTypeProfile, coverWeights: TokenWeights) {
  const weighted = profile.acceptedDescriptors
    .map((word) => ({
      word,
      score: coverWeights[word] ?? 0,
    }))
    .sort((left, right) => right.score - left.score)
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.word)

  const fallback = profile.acceptedDescriptors.filter((word) => !weighted.includes(word))

  return [...weighted, ...fallback].slice(0, 3)
}

function pickCutWords(profile: PublicTypeProfile, cutWeights: TokenWeights) {
  const weighted = Object.entries(cutWeights)
    .sort((left, right) => right[1] - left[1])
    .map(([word]) => word)

  const fallback = profile.withheldDescriptors.filter((word) => !weighted.includes(word))

  return [...weighted, ...fallback].slice(0, 3)
}

function buildDraftResidue(
  cutWords: string[],
  conflicts: ConflictEvidence[],
  candidates: RankedCandidate[],
): DraftResidue {
  const marks = [
    ...cutWords.slice(0, 3).map((word) => ({
      text: word,
      tone: 'cut' as const,
      strike: true,
    })),
    ...conflicts.slice(0, 2).map((conflict) => ({
      text: `${conflict.before} -> ${conflict.after}`,
      tone: 'conflict' as const,
    })),
    ...candidates
      .slice(1, 3)
      .flatMap((candidate) => candidate.reasonWords.slice(0, 1))
      .map((word) => ({
        text: word,
        tone: 'alternate' as const,
      })),
  ]

  return {
    marks: marks.slice(0, 6),
    marginNote: cutWords.length ? '裁切' : '边角',
  }
}

function buildTraceNotes(
  conflicts: ConflictEvidence[],
  cutWords: string[],
  candidates: RankedCandidate[],
): TraceNote[] {
  const notes: string[] = []

  conflicts.slice(0, 2).forEach((conflict) => {
    notes.push(`${conflict.before} -> ${conflict.after}`)
  })

  if (cutWords.length) {
    notes.push(cutWords.slice(0, 2).join(' / '))
  }

  if (notes.length < 3 && candidates[1]) {
    notes.push(candidates[1].reasonWords.join(' / ') || candidates[1].name)
  }

  return notes.slice(0, 3).map((text) => ({ text }))
}

export function shuffleQuestions(questionList: QuizQuestion[]) {
  const copy = [...questionList]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

export function buildQuestionDeck() {
  return shuffleQuestions(questions)
}

export function computeResult(answers: Record<string, number>): ResultSnapshot {
  const axisScores = buildAxisScores(answers)
  const axisLevels = buildAxisLevels(axisScores)
  const { coverWeights, cutWeights, coverPriority } = collectOutcomeTokens(answers)
  const conflictEvidence = buildConflictEvidence(answers)
  const candidatePool = buildCandidatePool(axisLevels, coverWeights, cutWeights, conflictEvidence, coverPriority)
  const selectedCandidate = candidatePool[0]
  const publicType = selectedCandidate?.profile ?? publicTypeProfiles[0]
  const coverWords = pickCoverWords(publicType, coverWeights)
  const cutWords = pickCutWords(publicType, cutWeights)

  return {
    axisScores,
    axisLevels,
    publicType,
    candidatePool: candidatePool.map((candidate) => ({
      code: candidate.code,
      name: candidate.name,
      score: candidate.score,
      reasonWords: candidate.reasonWords,
    })),
    coverWords,
    cutWords,
    conflictEvidence,
    draftResidue: buildDraftResidue(cutWords, conflictEvidence, candidatePool),
    traceNotes: buildTraceNotes(conflictEvidence, cutWords, candidatePool),
    brandRevealState: 'tmti',
    defaultExportMode: DEFAULT_EXPORT_MODE,
  }
}
