import type {
  ConflictEvidence,
  MotifId,
  PendingResult,
  PublicTypeProfile,
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

function normalizePublicType(raw: unknown): PublicTypeProfile | null {
  if (!isRecord(raw)) {
    return null
  }

  if (
    typeof raw.code !== 'string' ||
    typeof raw.name !== 'string' ||
    typeof raw.shortDefinition !== 'string' ||
    typeof raw.subtitle !== 'string' ||
    typeof raw.motif !== 'string' ||
    typeof raw.themeToken !== 'string' ||
    !isStringArray(raw.acceptedDescriptors) ||
    !isStringArray(raw.withheldDescriptors)
  ) {
    return null
  }

  return {
    code: raw.code,
    name: raw.name,
    shortDefinition: raw.shortDefinition,
    subtitle: raw.subtitle,
    motif: raw.motif as MotifId,
    themeToken: raw.themeToken as ThemeToken,
    target: isRecord(raw.target)
      ? (raw.target as PublicTypeProfile['target'])
      : { public: 2, exposure: 2, boundary: 2, stability: 2 },
    acceptedDescriptors: raw.acceptedDescriptors,
    withheldDescriptors: raw.withheldDescriptors,
  }
}

function normalizeTraceNotes(value: unknown): TraceNote[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is { text: string } => isRecord(item) && typeof item.text === 'string')
    .map((item) => ({ text: item.text }))
}

function normalizeCandidates(value: unknown): ResultCandidate[] {
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

function normalizeConflictEvidence(value: unknown): ConflictEvidence[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is ConflictEvidence =>
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
}

function normalizeResidueMarks(value: unknown): ResidueMark[] {
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

function normalizeLegacyResidue(raw: unknown): ResidueMark[] {
  if (!isRecord(raw)) {
    return []
  }

  const draftResidue = isRecord(raw.draftResidue) ? raw.draftResidue : isRecord(raw.draftCard) ? raw.draftCard : null

  if (!draftResidue) {
    return []
  }

  const marks = normalizeResidueMarks(draftResidue.marks)
  if (marks.length) {
    return marks
  }

  if (isStringArray(draftResidue.lines)) {
    return draftResidue.lines.map((text, index) => ({
      text,
      tone: index === 0 ? 'cut' : 'alternate',
      strike: index === 0,
    }))
  }

  if (Array.isArray(draftResidue.fragments)) {
    return draftResidue.fragments
      .filter((item): item is { text: string } => isRecord(item) && typeof item.text === 'string')
      .map((item, index) => ({
        text: item.text,
        tone: index === 0 ? 'cut' : 'alternate',
        strike: index === 0,
      }))
  }

  return []
}

function normalizeSnapshot(raw: unknown): ResultSnapshot | null {
  if (!isRecord(raw)) {
    return null
  }

  const selectedCover = normalizePublicType(raw.selectedCover ?? raw.publicType)

  if (!selectedCover) {
    return null
  }

  const residueMarks = normalizeResidueMarks(raw.residueMarks)
  const legacyResidueMarks = residueMarks.length ? residueMarks : normalizeLegacyResidue(raw)
  const coverWords = isStringArray(raw.coverWords) ? raw.coverWords : selectedCover.acceptedDescriptors.slice(0, 3)
  const cutWords = isStringArray(raw.cutWords)
    ? raw.cutWords
    : legacyResidueMarks
        .filter((mark) => mark.tone === 'cut')
        .map((mark) => mark.text)
        .slice(0, 4)
  const candidatePool = normalizeCandidates(raw.candidatePool)
  const normalizedCandidatePool =
    candidatePool.length > 0
      ? candidatePool
      : [
          {
            code: selectedCover.code,
            name: selectedCover.name,
            score: 100,
            reasonWords: coverWords,
          },
        ]

  return {
    axisScores: isRecord(raw.axisScores)
      ? (raw.axisScores as ResultSnapshot['axisScores'])
      : { public: 0, exposure: 0, boundary: 0, stability: 0 },
    axisLevels: isRecord(raw.axisLevels)
      ? (raw.axisLevels as ResultSnapshot['axisLevels'])
      : { public: 2, exposure: 2, boundary: 2, stability: 2 },
    selectedCover,
    candidatePool: normalizedCandidatePool,
    coverWords,
    cutWords,
    conflictEvidence: normalizeConflictEvidence(raw.conflictEvidence),
    residueMarks: legacyResidueMarks,
    traceNotes: normalizeTraceNotes(raw.traceNotes),
    brandRevealState:
      raw.brandRevealState === 'draft-peek' || raw.brandRevealState === 'meta-visible' ? raw.brandRevealState : 'tmti',
    defaultExportMode: raw.defaultExportMode === 'cover-with-trace' ? 'cover-with-trace' : 'cover',
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

  if (snapshot && (!isRecord(parsedSnapshot) || !isRecord(parsedSnapshot.selectedCover) || !Array.isArray(parsedSnapshot.residueMarks))) {
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
