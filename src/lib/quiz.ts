import { publicTypeProfiles } from '../data/publicTypes'
import { questions } from '../data/questions'
import { DEFAULT_EXPORT_MODE } from './reveal'
import type {
  AxisId,
  DraftResidue,
  PublicTypeProfile,
  QuizQuestion,
  ResultSnapshot,
  TraceNote,
} from '../types'

function scoreToLevel(score: number): 1 | 2 | 3 {
  if (score <= 9) {
    return 1
  }

  if (score <= 13) {
    return 2
  }

  return 3
}

function collectMirrorBias(answers: Record<string, number>) {
  return questions.reduce((total, question) => {
    if (!question.mirrorOf) {
      return total
    }

    const original = answers[question.mirrorOf]
    const mirrored = answers[question.id]

    if (original === undefined || mirrored === undefined) {
      return total
    }

    return total + Math.max(0, mirrored - original)
  }, 0)
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
  return Object.entries(axisScores).reduce<Record<AxisId, 1 | 2 | 3>>((levels, [axis, score]) => {
    levels[axis as AxisId] = scoreToLevel(score)
    return levels
  }, {} as Record<AxisId, 1 | 2 | 3>)
}

function rankPublicTypes(levels: Record<AxisId, 1 | 2 | 3>) {
  return [...publicTypeProfiles]
    .map((profile) => ({
      profile,
      distance:
        Math.abs(profile.target.public - levels.public) +
        Math.abs(profile.target.exposure - levels.exposure) +
        Math.abs(profile.target.boundary - levels.boundary) +
        Math.abs(profile.target.stability - levels.stability),
    }))
    .sort((left, right) => left.distance - right.distance)
}

function buildAvoidedText(levels: Record<AxisId, 1 | 2 | 3>) {
  if (levels.exposure === 3) {
    return '需要回应、怕被误解、想确认关系'
  }

  if (levels.exposure === 2) {
    return '解释成本太高、情绪留在边缘、把在意再压一下'
  }

  return '过度克制、完全留白、把自己收得太紧'
}

function buildWithheldText(profile: PublicTypeProfile, levels: Record<AxisId, 1 | 2 | 3>) {
  const dynamic: string[] = []

  if (levels.boundary === 1) {
    dynamic.push('会跟着气氛走')
  }

  if (levels.stability === 1) {
    dynamic.push('情绪起伏会改写判断')
  }

  if (levels.public === 1) {
    dynamic.push('不想被一句话概括')
  }

  const merged = [...profile.withheldDescriptors, ...dynamic]
  return Array.from(new Set(merged)).slice(0, 3).join('、')
}

function buildOptionalResidue(levels: Record<AxisId, 1 | 2 | 3>, mirrorBias: number) {
  if (mirrorBias >= 2) {
    return '会先选更容易公开认领的说法'
  }

  if (levels.stability === 1) {
    return '不同场合会换一层语气，只留下最稳的一句'
  }

  return null
}

function buildDraftResidue(
  profile: PublicTypeProfile,
  levels: Record<AxisId, 1 | 2 | 3>,
  mirrorBias: number,
): DraftResidue {
  const lines = [
    profile.acceptedDescriptors.slice(0, 3).join('、'),
    buildAvoidedText(levels),
    buildWithheldText(profile, levels),
  ]

  const optional = buildOptionalResidue(levels, mirrorBias)

  if (optional) {
    lines.push(optional)
  }

  return {
    lines: lines.slice(0, 4),
    marginNote: levels.exposure === 3 ? '未导出' : '保留',
  }
}

function buildTraceNotes(levels: Record<AxisId, 1 | 2 | 3>, mirrorBias: number): TraceNote[] {
  const notes: TraceNote[] = []

  if (mirrorBias >= 2) {
    notes.push({ text: '你更快接受顺口说法' })
  } else if (levels.public === 3) {
    notes.push({ text: '顺手表达被更早选中' })
  } else {
    notes.push({ text: '留白感被保留下来' })
  }

  if (levels.exposure === 3) {
    notes.push({ text: '高暴露描述多次未入选' })
  } else if (levels.exposure === 2) {
    notes.push({ text: '高暴露表达被往后放' })
  } else {
    notes.push({ text: '直接表达保留得更多' })
  }

  if (levels.boundary === 3) {
    notes.push({ text: '边界语气出现得更早' })
  } else if (levels.boundary === 1) {
    notes.push({ text: '回应需求没有消失' })
  } else if (levels.stability === 1) {
    notes.push({ text: '不确定感被压低了一点' })
  } else {
    notes.push({ text: '稳定叙述更容易留下' })
  }

  return notes
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
  const mirrorBias = collectMirrorBias(answers)
  const ranked = rankPublicTypes(axisLevels)
  const publicType = ranked[0]?.profile ?? publicTypeProfiles[0]

  return {
    axisScores,
    axisLevels,
    publicType,
    draftResidue: buildDraftResidue(publicType, axisLevels, mirrorBias),
    traceNotes: buildTraceNotes(axisLevels, mirrorBias),
    brandRevealState: 'tmti',
    defaultExportMode: DEFAULT_EXPORT_MODE,
  }
}
