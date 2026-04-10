import { outcomePacks } from './outcomePacks'
import { questionTemplates, themeSeeds } from './questionTemplates'
import { sourceTraces } from './sourceTraces'
import { themePacks } from './themePacks'

export const manifest = {
  themeSeedCount: themeSeeds.length,
  themePackCount: themePacks.length,
  outcomePackCount: outcomePacks.length,
  questionTemplateCount: questionTemplates.length,
  sourceTraceCount: sourceTraces.length,
  themePackIds: themePacks.map((pack) => pack.id),
  outcomePackIds: outcomePacks.map((pack) => pack.id),
}

