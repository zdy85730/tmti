import { appConfig } from '../config'
import { generatorQuestions } from '../data/generatorQuestions'
import { manifest } from '../data/manifest'
import { outcomePacks } from '../data/outcomePacks'
import { questionTemplates, themeSeeds } from '../data/questionTemplates'
import { sourceTraces } from '../data/sourceTraces'
import { themePackQuestions, themePacks } from '../data/themePacks'
import type {
  BuilderRhythm,
  BuilderScene,
  BuilderTitleStyle,
  GeneratedQuizDefinition,
  GeneratedQuizResult,
  GeneratorAnswerMap,
  GeneratorProfile,
  OutcomePack,
  QuizFamily,
  QuizTokenPayload,
  ThemePack,
  ThemeToken,
  TonePack,
} from '../types'

declare const Buffer:
  | {
      from(input: string, encoding?: string): {
        toString(encoding: string): string
      }
    }
  | undefined

const tokenVersion = 1 as const

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function createSeededRandom(seed: number) {
  let next = seed >>> 0

  return () => {
    next = (next * 1664525 + 1013904223) >>> 0
    return next / 4294967296
  }
}

function shuffleWithSeed<T>(items: T[], seed: number) {
  const copy = [...items]
  const random = createSeededRandom(seed)

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

function toBase64Url(value: string) {
  if (typeof window === 'undefined') {
    return Buffer!.from(value, 'utf8').toString('base64url')
  }

  const encoded = window.btoa(unescape(encodeURIComponent(value)))
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  if (typeof window === 'undefined') {
    return Buffer!.from(value, 'base64url').toString('utf8')
  }

  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return decodeURIComponent(escape(window.atob(padded)))
}

function isQuizFamily(value: string): value is QuizFamily {
  return ['boundary', 'response', 'stability', 'exposure'].includes(value)
}

function isTonePack(value: string): value is TonePack {
  return ['soft', 'clean', 'sharp', 'observant'].includes(value)
}

function isThemeToken(value: string): value is ThemeToken {
  return ['ember', 'ink', 'moss', 'berry', 'slate', 'dusk', 'linen', 'glass'].includes(value)
}

function isScene(value: string): value is BuilderScene {
  return ['relationship', 'friendship', 'work', 'mixed'].includes(value)
}

function isRhythm(value: string): value is BuilderRhythm {
  return ['scene', 'judgment', 'mixed'].includes(value)
}

function isTitleStyle(value: string): value is BuilderTitleStyle {
  return ['plain', 'essay', 'crisp'].includes(value)
}

function getThemePack(themePackId: string) {
  return themePacks.find((pack) => pack.id === themePackId) ?? null
}

function getOutcomePack(outcomePackId: string) {
  return outcomePacks.find((pack) => pack.id === outcomePackId) ?? null
}

function resolveQuestions(questionIds: string[]) {
  return questionIds.map((questionId) => themePackQuestions[questionId]).filter(Boolean)
}

function pickQuestions(pack: ThemePack, seed: number) {
  const allQuestions = resolveQuestions(pack.questionIds)
  const themeQuestions = allQuestions.filter((question) => question.role === 'theme')
  const mirrorQuestions = allQuestions.filter((question) => question.role === 'mirror')
  const calibrationQuestions = allQuestions.filter((question) => question.role === 'calibration')

  const pickedTheme = shuffleWithSeed(themeQuestions, seed).slice(0, 6)
  return [...pickedTheme, ...mirrorQuestions, ...calibrationQuestions]
}

function pickThemePack(profile: GeneratorProfile) {
  const matchingFamily = themePacks.filter((pack) => pack.family === profile.selectedFamily)
  const ranked = matchingFamily
    .map((pack) => {
      let score = 0

      if (pack.scene === profile.selectedScene) {
        score += 3
      } else if (profile.selectedScene === 'mixed' || pack.scene === 'mixed') {
        score += 1
      }

      if (pack.rhythm === profile.selectedRhythm) {
        score += 2
      } else if (profile.selectedRhythm === 'mixed' || pack.rhythm === 'mixed') {
        score += 1
      }

      if (pack.tonePacks.includes(profile.selectedTone)) {
        score += 1
      }

      return { pack, score }
    })
    .sort((left, right) => right.score - left.score || left.pack.id.localeCompare(right.pack.id))

  return ranked[Math.abs(profile.seed) % ranked.length]?.pack ?? matchingFamily[0]
}

function buildQuizId(themePackId: string, seed: number) {
  return `${themePackId}-${seed.toString(36)}`
}

export function buildGeneratorProfile(answers: GeneratorAnswerMap): GeneratorProfile {
  const selectedFamily = isQuizFamily(answers.family) ? answers.family : 'boundary'
  const selectedScene = isScene(answers.scene) ? answers.scene : 'mixed'
  const selectedTone = isTonePack(answers.tone) ? answers.tone : 'clean'
  const selectedRhythm = isRhythm(answers.rhythm) ? answers.rhythm : 'mixed'
  const selectedTitleStyle = isTitleStyle(answers.titleStyle) ? answers.titleStyle : 'plain'
  const selectedThemeToken = isThemeToken(answers.themeToken) ? answers.themeToken : 'linen'

  const familyScores: Record<QuizFamily, number> = {
    boundary: selectedFamily === 'boundary' ? 4 : 1,
    response: selectedFamily === 'response' ? 4 : 1,
    stability: selectedFamily === 'stability' ? 4 : 1,
    exposure: selectedFamily === 'exposure' ? 4 : 1,
  }

  const seedSource = generatorQuestions.map((question) => `${question.id}:${answers[question.id] ?? 'unset'}`).join('|')

  return {
    familyScores,
    selectedFamily,
    selectedScene,
    selectedTone,
    selectedRhythm,
    selectedTitleStyle,
    selectedThemeToken,
    seed: hashString(seedSource),
  }
}

export function buildGeneratedQuiz(profile: GeneratorProfile): GeneratedQuizDefinition {
  const pack = pickThemePack(profile)
  const tonePack = pack.tonePacks.includes(profile.selectedTone) ? profile.selectedTone : pack.tonePacks[0]
  const title = pack.titleVariants[tonePack][profile.selectedTitleStyle]
  const intro = pack.introVariants[tonePack]
  const questions = pickQuestions(pack, profile.seed)

  return {
    id: buildQuizId(pack.id, profile.seed),
    brandName: appConfig.brandName,
    title,
    intro,
    family: pack.family,
    themePackId: pack.id,
    tonePack,
    themeToken: profile.selectedThemeToken ?? pack.themeToken,
    seed: profile.seed,
    questionIds: questions.map((question) => question.id),
    questions,
    outcomePackId: pack.outcomePackId,
    metaTiLink: `${appConfig.siteUrl}?about=metati`,
  }
}

export function computeGeneratedQuizResult(
  answers: Record<string, string>,
  definition: GeneratedQuizDefinition,
): GeneratedQuizResult {
  const outcomePack = getOutcomePack(definition.outcomePackId)

  if (!outcomePack) {
    throw new Error(`Unknown outcome pack: ${definition.outcomePackId}`)
  }

  const axisScores = outcomePack.axes.reduce<Record<string, number>>((scores, axis) => {
    scores[axis.id] = 0
    return scores
  }, {})

  const axisMaximums = outcomePack.axes.reduce<Record<string, number>>((scores, axis) => {
    scores[axis.id] = definition.questions.length * 2
    return scores
  }, {})

  definition.questions.forEach((question) => {
    const selectedOptionId = answers[question.id]
    const selectedOption = question.options.find((option) => option.id === selectedOptionId)

    if (!selectedOption) {
      return
    }

    Object.entries(selectedOption.scores).forEach(([axisId, score]) => {
      axisScores[axisId] = (axisScores[axisId] ?? 0) + score
    })
  })

  const axisPercentages = Object.fromEntries(
    Object.entries(axisScores).map(([axisId, score]) => [axisId, Math.round((score / axisMaximums[axisId]) * 100)]),
  )

  const axisLevels = Object.fromEntries(
    Object.entries(axisPercentages).map(([axisId, percentage]) => [axisId, percentage >= 50 ? 'high' : 'low']),
  ) as Record<string, 'low' | 'high'>

  const outcome = outcomePack.outcomes.find(
    (candidate) =>
      candidate.key[0] === axisLevels[outcomePack.axes[0].id] && candidate.key[1] === axisLevels[outcomePack.axes[1].id],
  )

  if (!outcome) {
    throw new Error(`No outcome found for ${definition.outcomePackId}`)
  }

  return {
    outcome,
    axisScores,
    axisPercentages,
    axisLevels,
  }
}

export function encodeQuizToken(definition: GeneratedQuizDefinition) {
  const payload: QuizTokenPayload = {
    version: tokenVersion,
    quizId: definition.id,
    family: definition.family,
    themePackId: definition.themePackId,
    tonePack: definition.tonePack,
    themeToken: definition.themeToken,
    seed: definition.seed,
    questionIds: definition.questionIds,
    outcomePackId: definition.outcomePackId,
    title: definition.title,
    intro: definition.intro,
  }

  return toBase64Url(JSON.stringify(payload))
}

export function decodeQuizToken(token: string): GeneratedQuizDefinition | null {
  try {
    const payload = JSON.parse(fromBase64Url(token)) as Partial<QuizTokenPayload>

    if (
      payload.version !== tokenVersion ||
      !payload.quizId ||
      !payload.themePackId ||
      !payload.tonePack ||
      !payload.themeToken ||
      !payload.outcomePackId ||
      !payload.title ||
      !payload.intro ||
      !Array.isArray(payload.questionIds)
    ) {
      return null
    }

    const pack = getThemePack(payload.themePackId)
    if (!pack) {
      return null
    }

    const questions = resolveQuestions(payload.questionIds)
    if (questions.length !== payload.questionIds.length) {
      return null
    }

    return {
      id: payload.quizId,
      brandName: appConfig.brandName,
      title: payload.title,
      intro: payload.intro,
      family: pack.family,
      themePackId: pack.id,
      tonePack: payload.tonePack,
      themeToken: payload.themeToken,
      seed: payload.seed ?? hashString(payload.quizId),
      questionIds: payload.questionIds,
      questions,
      outcomePackId: payload.outcomePackId,
      metaTiLink: `${appConfig.siteUrl}?about=metati`,
    }
  } catch {
    return null
  }
}

export function validateThemePack(pack: ThemePack) {
  const errors: string[] = []
  const questions = resolveQuestions(pack.questionIds)

  if (questions.length !== 12) {
    errors.push(`${pack.id}: expected 12 questions`)
  }

  const duplicatePrompts = new Set<string>()
  questions.forEach((question) => {
    if (question.options.length !== 3) {
      errors.push(`${question.id}: expected 3 options`)
    }

    if (question.sourceTraceIds.length < 2) {
      errors.push(`${question.id}: expected at least 2 source traces`)
    }

    if (duplicatePrompts.has(question.prompt)) {
      errors.push(`${pack.id}: duplicate prompt "${question.prompt}"`)
    }
    duplicatePrompts.add(question.prompt)
  })

  if (!getOutcomePack(pack.outcomePackId)) {
    errors.push(`${pack.id}: unknown outcome pack`)
  }

  return errors
}

export function validateContentModel() {
  const errors = [
    ...themePacks.flatMap((pack) => validateThemePack(pack)),
    ...themeSeeds.flatMap((seed) => (seed.sourceKinds.length >= 3 ? [] : [`${seed.id}: not enough source kinds`])),
    ...questionTemplates.flatMap((template) =>
      template.toneSupport.length ? [] : [`${template.id}: no tone support configured`],
    ),
  ]

  const availableTraceIds = new Set(sourceTraces.map((trace) => trace.id))
  Object.values(themePackQuestions).forEach((question) => {
    question.sourceTraceIds.forEach((traceId) => {
      if (!availableTraceIds.has(traceId)) {
        errors.push(`${question.id}: missing source trace ${traceId}`)
      }
    })
  })

  if (manifest.themePackCount !== themePacks.length) {
    errors.push('manifest: theme pack count mismatch')
  }

  return errors
}

export function buildQuizFromAnswers(answers: GeneratorAnswerMap) {
  return buildGeneratedQuiz(buildGeneratorProfile(answers))
}

export function getOutcomePackById(outcomePackId: string): OutcomePack | null {
  return getOutcomePack(outcomePackId)
}
