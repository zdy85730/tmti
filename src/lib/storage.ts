import type { GeneratedQuizDefinition, GeneratorAnswerMap, StoredQuizSession, ThemePackQuestion } from '../types'

const SESSION_KEY = 'tmti:last-generated'

function safeParse(raw: string | null) {
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveGeneratedQuizSession(definition: GeneratedQuizDefinition, builderAnswers: GeneratorAnswerMap) {
  const payload: StoredQuizSession = {
    definition,
    builderAnswers,
    createdAt: Date.now(),
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

export function loadGeneratedQuizSession(): StoredQuizSession | null {
  const parsed = safeParse(localStorage.getItem(SESSION_KEY))

  if (!parsed || typeof parsed !== 'object' || parsed === null) {
    return null
  }

  const record = parsed as Record<string, unknown>

  if (typeof record.createdAt !== 'number' || typeof record.definition !== 'object' || record.definition === null) {
    return null
  }

  const definition = record.definition as Record<string, unknown>
  if (
    typeof definition.id !== 'string' ||
    typeof definition.title !== 'string' ||
    typeof definition.intro !== 'string' ||
    typeof definition.themePackId !== 'string' ||
    typeof definition.outcomePackId !== 'string' ||
    !Array.isArray(definition.questionIds) ||
    !Array.isArray(definition.questions)
  ) {
    return null
  }

  const builderAnswers =
    typeof record.builderAnswers === 'object' && record.builderAnswers !== null
      ? (record.builderAnswers as GeneratorAnswerMap)
      : {}

  return {
    definition: {
      ...definition,
      questions: definition.questions as ThemePackQuestion[],
    } as GeneratedQuizDefinition,
    builderAnswers,
    createdAt: record.createdAt,
  }
}

export function clearGeneratedQuizSession() {
  localStorage.removeItem(SESSION_KEY)
}
