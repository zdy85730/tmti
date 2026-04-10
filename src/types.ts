export type Screen = 'intro' | 'quiz' | 'gate' | 'result'

export type AxisId = 'public' | 'exposure' | 'boundary' | 'stability'

export type SignalTag = 'regular' | 'mirror' | 'preference' | 'exposure'

export type MotifId = 'frame' | 'orbit' | 'column' | 'ripple' | 'veil' | 'band' | 'grid' | 'arc'

export type ThemeToken = 'ember' | 'ink' | 'moss' | 'berry' | 'slate' | 'dusk' | 'linen' | 'glass'

export type BrandRevealState = 'tmti' | 'draft-peek' | 'meta-visible'
export type BrandRevealEvent = 'peek-draft' | 'select-trace-export'

export type ExportMode = 'cover' | 'cover-with-trace'

export interface QuizOption {
  label: string
  value: 1 | 2 | 3
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

export interface DraftResidue {
  lines: string[]
  marginNote?: string
}

export interface TraceNote {
  text: string
}

export interface ResultSnapshot {
  axisScores: Record<AxisId, number>
  axisLevels: Record<AxisId, 1 | 2 | 3>
  publicType: PublicTypeProfile
  draftResidue: DraftResidue
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
