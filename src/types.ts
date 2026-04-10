export type Screen = 'intro' | 'builder' | 'preview' | 'play' | 'result' | 'about'

export type ThemeToken = 'ember' | 'ink' | 'moss' | 'berry' | 'slate' | 'dusk' | 'linen' | 'glass'
export type QuizFamily = 'boundary' | 'response' | 'stability' | 'exposure'
export type TonePack = 'soft' | 'clean' | 'sharp' | 'observant'
export type VoicePackId = 'groupchat' | 'shortvideo' | 'danmu'
export type QuestionRole = 'theme' | 'mirror' | 'calibration'
export type SourceKind = 'social' | 'forum' | 'editorial' | 'seed'
export type BuilderScene = 'work' | 'game' | 'mixed'
export type BuilderRhythm = 'scene' | 'judgment' | 'mixed'
export type BuilderTitleStyle = 'plain' | 'essay' | 'crisp'
export type SlangLevel = 'low' | 'medium' | 'high'

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

export interface GeneratorOption {
  value: string
  label: string
  description?: string
}

export interface GeneratorQuestion {
  id: string
  prompt: string
  eyebrow: string
  options: GeneratorOption[]
}

export type GeneratorAnswerMap = Record<string, string>

export interface GeneratorProfile {
  familyScores: Record<QuizFamily, number>
  selectedFamily: QuizFamily
  selectedScene: BuilderScene
  selectedTone: TonePack
  selectedRhythm: BuilderRhythm
  selectedTitleStyle: BuilderTitleStyle
  selectedThemeToken: ThemeToken
  seed: number
}

export interface SourceTrace {
  id: string
  kind: SourceKind
  platform: string
  label: string
  url: string | null
  publishedAt: string
  summary: string
  tags: string[]
}

export interface QuestionTemplate {
  id: string
  family: QuizFamily
  role: QuestionRole
  promptPattern: string
  optionPattern: string
  toneSupport: TonePack[]
}

export interface ThemeSeed {
  id: string
  name: string
  family: QuizFamily
  emotionTags: string[]
  sceneTags: string[]
  misunderstandingTags: string[]
  sourceKinds: SourceKind[]
}

export interface VoicePack {
  id: VoicePackId
  label: string
  previewEyebrow: string
  previewSheetLabel: string
  copyAction: string
  shareAction: string
  playAction: string
  copyFeedback: string
  nativeFeedback: string
  resultEyebrow: string
  resultSourceLabel: string
}

export interface GeneratedQuizOption {
  id: string
  label: string
  scores: Record<string, 0 | 1 | 2>
}

export interface ThemePackQuestion {
  id: string
  templateId: string
  role: QuestionRole
  tone: TonePack
  prompt: string
  options: GeneratedQuizOption[]
  axisFocus: [string, string]
  sourceTraceIds: string[]
  slangLevel?: SlangLevel
  sceneTag?: string
  voicePackOverrides?: Partial<Record<VoicePackId, string>>
}

export interface ThemePack {
  id: string
  family: QuizFamily
  seedId: string
  scene: BuilderScene
  rhythm: BuilderRhythm
  tonePacks: TonePack[]
  themeToken: ThemeToken
  voicePackId: VoicePackId
  memeTags: string[]
  questionIds: string[]
  outcomePackId: string
  headlineVariants: Record<TonePack, Record<BuilderTitleStyle, string>>
  hookVariants: Record<TonePack, string>
  shareTitle: string
  shareSubtitle: string
}

export interface OutcomeAxis {
  id: string
  label: string
  lowLabel: string
  highLabel: string
}

export interface GeneratedQuizOutcome {
  id: string
  key: [lowHigh: 'low' | 'high', lowHigh: 'low' | 'high']
  nickname: string
  tagline: string
  summary: string
  shareLine: string
}

export interface OutcomePack {
  id: string
  family: QuizFamily
  axes: [OutcomeAxis, OutcomeAxis]
  outcomes: GeneratedQuizOutcome[]
}

export interface GeneratedQuizDefinition {
  id: string
  brandName: string
  title: string
  intro: string
  family: QuizFamily
  themePackId: string
  tonePack: TonePack
  themeToken: ThemeToken
  voicePackId: VoicePackId
  memeTags: string[]
  seed: number
  questionIds: string[]
  questions: ThemePackQuestion[]
  outcomePackId: string
  shareTitle: string
  shareSubtitle: string
  metaTiLink: string
}

export interface GeneratedQuizResult {
  outcome: GeneratedQuizOutcome
  axisScores: Record<string, number>
  axisPercentages: Record<string, number>
  axisLevels: Record<string, 'low' | 'high'>
}

export interface QuizTokenPayload {
  version: 1
  quizId: string
  family: QuizFamily
  themePackId: string
  tonePack: TonePack
  themeToken: ThemeToken
  seed: number
  questionIds: string[]
  outcomePackId: string
  title: string
  intro: string
}

export interface StoredQuizSession {
  definition: GeneratedQuizDefinition
  builderAnswers: GeneratorAnswerMap
  createdAt: number
}

export interface ThemePackDraft {
  themePack: ThemePack
  questions: ThemePackQuestion[]
  riskNote: string
}
