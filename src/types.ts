export type Screen = 'intro' | 'quiz' | 'gate' | 'result'

export type AxisId = 'public' | 'exposure' | 'boundary' | 'stability'
export type QuizValue = 1 | 2 | 3

export type SignalTag = 'regular' | 'mirror' | 'preference' | 'exposure'

export type MotifId = 'frame' | 'orbit' | 'column' | 'ripple' | 'veil' | 'band' | 'grid' | 'arc'

export type ThemeToken = 'ember' | 'ink' | 'moss' | 'berry' | 'slate' | 'dusk' | 'linen' | 'glass'

export type BrandRevealState = 'tmti' | 'draft-peek' | 'meta-visible'
export type BrandRevealEvent = 'peek-draft' | 'inspect-preview' | 'attempt-share' | 'select-trace-export'

export type ExportMode = 'cover' | 'cover-with-trace'

export interface QuizOption {
  label: string
  value: QuizValue
}

export interface QuizQuestion {
  id: string
  axis: AxisId
  prompt: string
  options: QuizOption[]
  mirrorOf?: string
  signalTags: SignalTag[]
}

export interface PublicTypeProfile {
  code: string
  name: string
  shortDefinition: string
  subtitle: string
  motif: MotifId
  themeToken: ThemeToken
  target: Record<AxisId, 1 | 2 | 3>
  acceptedDescriptors: string[]
  withheldDescriptors: string[]
}

export interface QuestionOutcomeConfig {
  coverTokens?: Record<QuizValue, string[]>
  cutTokens?: Record<QuizValue, string[]>
  candidateHints?: Record<QuizValue, string[]>
  priorityWeights?: Record<QuizValue, number>
  conflictCue?: string
}

export interface ResultCandidate {
  code: string
  name: string
  score: number
  reasonWords: string[]
}

export interface ConflictEvidence {
  cue: string
  before: string
  after: string
  severity: 'soft' | 'hard'
}

export interface ResidueMark {
  text: string
  tone: 'cut' | 'conflict' | 'alternate'
  strike?: boolean
}

export interface TraceNote {
  text: string
}

export interface ResultSnapshot {
  axisScores: Record<AxisId, number>
  axisLevels: Record<AxisId, QuizValue>
  selectedCover: PublicTypeProfile
  candidatePool: ResultCandidate[]
  coverWords: string[]
  cutWords: string[]
  conflictEvidence: ConflictEvidence[]
  residueMarks: ResidueMark[]
  traceNotes: TraceNote[]
  brandRevealState: BrandRevealState
  defaultExportMode: ExportMode
}

export interface PendingResult {
  sessionId: string
  unlockAt: number
  createdAt: number
}

export interface ThemePalette {
  paper: string
  paperSoft: string
  accent: string
  accentSoft: string
  text: string
  subtext: string
  line: string
  glow: string
  ghost: string
  draftPaper: string
}
