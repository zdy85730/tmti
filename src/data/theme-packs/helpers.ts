import type {
  BuilderTitleStyle,
  GeneratedQuizOption,
  ThemePack,
  ThemePackQuestion,
  TonePack,
} from '../../types'

export type TitleVariants = Record<TonePack, Record<BuilderTitleStyle, string>>

export interface ThemePackDefinition extends Omit<ThemePack, 'questionIds'> {
  questions: ThemePackQuestion[]
}

export function option(
  id: string,
  label: string,
  axisA: string,
  axisB: string,
  scoreA: 0 | 1 | 2,
  scoreB: 0 | 1 | 2,
): GeneratedQuizOption {
  return {
    id,
    label,
    scores: {
      [axisA]: scoreA,
      [axisB]: scoreB,
    },
  }
}

export function buildTitles(plain: string, essay: string, crisp: string): Record<BuilderTitleStyle, string> {
  return {
    plain,
    essay,
    crisp,
  }
}

export function toneTitles(
  soft: Record<BuilderTitleStyle, string>,
  clean: Record<BuilderTitleStyle, string>,
  sharp: Record<BuilderTitleStyle, string>,
  observant: Record<BuilderTitleStyle, string>,
): TitleVariants {
  return { soft, clean, sharp, observant }
}

