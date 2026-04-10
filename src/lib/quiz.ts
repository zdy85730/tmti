import { publicTypeProfiles } from '../data/publicTypes'
import { questions } from '../data/questions'
import { DEFAULT_EXPORT_MODE } from './reveal'
import type {
  AxisId,
  DraftCard,
  DraftFragment,
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

function pickDraftTitle(levels: Record<AxisId, 1 | 2 | 3>, mirrorBias: number) {
  if (mirrorBias >= 2) {
    return '另一种读法'
  }

  if (levels.exposure === 3) {
    return '未上封面的部分'
  }

  if (levels.boundary === 1) {
    return '保留片段'
  }

  return '侧写留痕'
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

function buildOptionalFragment(levels: Record<AxisId, 1 | 2 | 3>, mirrorBias: number): DraftFragment | null {
  if (mirrorBias >= 2) {
    return {
      label: '保留描述',
      text: '你会先选更容易公开认领的说法',
    }
  }

  if (levels.stability === 1) {
    return {
      label: '保留描述',
      text: '不同场合会换一层语气，封面只留下最稳的一版',
    }
  }

  return null
}

function buildDraftCard(
  profile: PublicTypeProfile,
  levels: Record<AxisId, 1 | 2 | 3>,
  mirrorBias: number,
): DraftCard {
  const fragments: DraftFragment[] = [
    {
      label: '更快接受',
      text: profile.acceptedDescriptors.slice(0, 3).join('、'),
    },
    {
      label: '多次回避',
      text: buildAvoidedText(levels),
    },
    {
      label: '未进入封面',
      text: buildWithheldText(profile, levels),
    },
  ]

  const optional = buildOptionalFragment(levels, mirrorBias)

  if (optional) {
    fragments.push(optional)
  }

  return {
    title: pickDraftTitle(levels, mirrorBias),
    fragments,
    note: levels.exposure === 3 ? '这部分被保留下来，但没有上封面。' : '该部分未进入默认展示。',
  }
}

function buildTraceNotes(levels: Record<AxisId, 1 | 2 | 3>, mirrorBias: number): TraceNote[] {
  const notes: TraceNote[] = []

  if (mirrorBias >= 2) {
    notes.push({ text: '你更快接受顺口说法' })
  } else if (levels.public === 3) {
    notes.push({ text: '可公开性被优先保留' })
  } else {
    notes.push({ text: '封面保留了一点留白' })
  }

  if (levels.exposure === 3) {
    notes.push({ text: '高暴露描述多次未入选' })
  } else if (levels.exposure === 2) {
    notes.push({ text: '暴露感被压到后层' })
  } else {
    notes.push({ text: '直接表达没有被删掉' })
  }

  if (levels.boundary === 3) {
    notes.push({ text: '边界语气先上了封面' })
  } else if (levels.boundary === 1) {
    notes.push({ text: '需要回应留在底稿里' })
  } else if (levels.stability === 1) {
    notes.push({ text: '不确定感没有上封面' })
  } else {
    notes.push({ text: '稳定叙述先被导出' })
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
    draftCard: buildDraftCard(publicType, axisLevels, mirrorBias),
    traceNotes: buildTraceNotes(axisLevels, mirrorBias),
    brandRevealState: 'tmti',
    defaultExportMode: DEFAULT_EXPORT_MODE,
  }
}
