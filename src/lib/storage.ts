import type {
  DraftResidue,
  MotifId,
  PendingResult,
  ResidueMark,
  ResultCandidate,
  ResultSnapshot,
  ThemeToken,
  TraceNote,
} from '../types'

const PENDING_RESULT_KEY = 'tmti:pending-result'
const RESULT_SNAPSHOT_KEY = 'tmti:last-result'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function normalizeTraceNotes(value: unknown): TraceNote[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is { text: string } => isRecord(item) && typeof item.text === 'string')
    .map((item) => ({ text: item.text }))
}

function normalizeResultCandidates(value: unknown): ResultCandidate[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is ResultCandidate =>
        isRecord(item) &&
        typeof item.code === 'string' &&
        typeof item.name === 'string' &&
        typeof item.score === 'number' &&
        isStringArray(item.reasonWords),
    )
    .map((item) => ({
      code: item.code,
      name: item.name,
      score: item.score,
      reasonWords: item.reasonWords,
    }))
}

function normalizeMarks(value: unknown): ResidueMark[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is ResidueMark =>
        isRecord(item) &&
        typeof item.text === 'string' &&
        (item.tone === 'cut' || item.tone === 'conflict' || item.tone === 'alternate'),
    )
    .map((item) => ({
      text: item.text,
      tone: item.tone,
      strike: item.strike === true,
    }))
}

function normalizeDraftResidue(value: unknown): DraftResidue | null {
  if (!isRecord(value)) {
    return null
  }

  const directMarks = normalizeMarks(value.marks)

  if (directMarks.length) {
    return {
      marks: directMarks,
      marginNote: typeof value.marginNote === 'string' ? value.marginNote : undefined,
    }
  }

  if (isStringArray(value.lines)) {
    return {
      marks: value.lines.map((text, index) => ({
        text,
        tone: index === 0 ? 'cut' : 'alternate',
        strike: index === 0,
      })),
      marginNote: typeof value.marginNote === 'string' ? value.marginNote : undefined,
    }
  }

  if (Array.isArray(value.fragments)) {
    const legacyMarks = value.fragments
      .filter(
        (item): item is { text: string } =>
          isRecord(item) && typeof item.text === 'string',
      )
      .map((item, index) => {
        const tone: ResidueMark['tone'] = index === 0 ? 'cut' : 'alternate'

        return {
          text: item.text,
          tone,
          strike: index === 0,
        }
      })

    if (legacyMarks.length) {
      return {
        marks: legacyMarks,
        marginNote:
          typeof value.marginNote === 'string'
            ? value.marginNote
            : typeof value.note === 'string'
              ? value.note
              : typeof value.title === 'string'
                ? value.title
                : undefined,
      }
    }
  }

  return null
}

function normalizeSnapshot(raw: unknown): ResultSnapshot | null {
  if (!isRecord(raw) || !isRecord(raw.publicType)) {
    return null
  }

  const publicType = raw.publicType

  if (
    typeof publicType.code !== 'string' ||
    typeof publicType.name !== 'string' ||
    typeof publicType.shortDefinition !== 'string' ||
    typeof publicType.subtitle !== 'string' ||
    typeof publicType.motif !== 'string' ||
    typeof publicType.themeToken !== 'string' ||
    !isStringArray(publicType.acceptedDescriptors) ||
    !isStringArray(publicType.withheldDescriptors)
  ) {
    return null
  }

  const draftResidue = normalizeDraftResidue(raw.draftResidue ?? raw.draftCard)

  if (!draftResidue) {
    return null
  }

  const coverWords = isStringArray(raw.coverWords) ? raw.coverWords : publicType.acceptedDescriptors.slice(0, 3)
  const cutWords = isStringArray(raw.cutWords)
    ? raw.cutWords
    : draftResidue.marks
        .map((mark) => mark.text)
        .filter(Boolean)
        .slice(0, 3)

  const candidatePool = normalizeResultCandidates(raw.candidatePool)
  const fallbackCandidates =
    candidatePool.length > 0
      ? candidatePool
      : [
          {
            code: publicType.code,
            name: publicType.name,
            score: 100,
            reasonWords: coverWords,
          },
        ]

  const conflictEvidence =
    Array.isArray(raw.conflictEvidence) && raw.conflictEvidence.length > 0
      ? raw.conflictEvidence
          .filter(
            (item): item is ResultSnapshot['conflictEvidence'][number] =>
              isRecord(item) &&
              typeof item.cue === 'string' &&
              typeof item.before === 'string' &&
              typeof item.after === 'string' &&
              (item.severity === 'soft' || item.severity === 'hard'),
          )
          .map((item) => ({
            cue: item.cue,
            before: item.before,
            after: item.after,
            severity: item.severity,
          }))
      : []

  return {
    axisScores: isRecord(raw.axisScores) ? (raw.axisScores as ResultSnapshot['axisScores']) : { public: 0, exposure: 0, boundary: 0, stability: 0 },
    axisLevels: isRecord(raw.axisLevels)
      ? (raw.axisLevels as ResultSnapshot['axisLevels'])
      : { public: 2, exposure: 2, boundary: 2, stability: 2 },
    publicType: {
      code: publicType.code,
      name: publicType.name,
      shortDefinition: publicType.shortDefinition,
      subtitle: publicType.subtitle,
      motif: publicType.motif as MotifId,
      themeToken: publicType.themeToken as ThemeToken,
      target: isRecord(publicType.target)
        ? (publicType.target as ResultSnapshot['publicType']['target'])
        : { public: 2, exposure: 2, boundary: 2, stability: 2 },
      acceptedDescriptors: publicType.acceptedDescriptors,
      withheldDescriptors: publicType.withheldDescriptors,
    },
    candidatePool: fallbackCandidates,
    coverWords,
    cutWords,
    conflictEvidence,
    draftResidue,
    traceNotes: normalizeTraceNotes(raw.traceNotes),
    brandRevealState:
      raw.brandRevealState === 'draft-peek' || raw.brandRevealState === 'meta-visible' ? raw.brandRevealState : 'tmti',
    defaultExportMode: raw.defaultExportMode === 'cover-with-trace' ? 'cover-with-trace' : 'cover',
  }
}

function normalizePending(raw: unknown): PendingResult | null {
  if (!isRecord(raw) || typeof raw.sessionId !== 'string' || typeof raw.unlockAt !== 'number' || typeof raw.createdAt !== 'number') {
    return null
  }

  return {
    sessionId: raw.sessionId,
    unlockAt: raw.unlockAt,
    createdAt: raw.createdAt,
  }
}

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

export function saveResultSession(pending: PendingResult, snapshot: ResultSnapshot) {
  localStorage.setItem(PENDING_RESULT_KEY, JSON.stringify(pending))
  localStorage.setItem(RESULT_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function updateStoredSnapshot(snapshot: ResultSnapshot) {
  localStorage.setItem(RESULT_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function loadResultSession() {
  const parsedPending = safeParse(localStorage.getItem(PENDING_RESULT_KEY))
  const parsedSnapshot = safeParse(localStorage.getItem(RESULT_SNAPSHOT_KEY))
  const pending = normalizePending(parsedPending)
  const snapshot = normalizeSnapshot(parsedSnapshot)

  if (parsedPending && !pending) {
    localStorage.removeItem(PENDING_RESULT_KEY)
  }

  if (parsedSnapshot && !snapshot) {
    localStorage.removeItem(RESULT_SNAPSHOT_KEY)
    localStorage.removeItem(PENDING_RESULT_KEY)
  }

  if (snapshot && (!isStringArray(parsedSnapshot?.coverWords) || !Array.isArray(parsedSnapshot?.candidatePool))) {
    localStorage.setItem(RESULT_SNAPSHOT_KEY, JSON.stringify(snapshot))
  }

  return {
    pending,
    snapshot,
  }
}

export function clearPendingResult() {
  localStorage.removeItem(PENDING_RESULT_KEY)
}

export function clearResultSession() {
  localStorage.removeItem(PENDING_RESULT_KEY)
  localStorage.removeItem(RESULT_SNAPSHOT_KEY)
}
