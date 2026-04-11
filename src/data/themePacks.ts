import type { ThemePack, ThemePackQuestion } from '../types'
import { memeLexicon } from './memeLexicon'
import { debugBlameBank } from './theme-packs/debugBlameBank'
import { buildTitles, sameToneTitles } from './theme-packs/helpers'
import { gachaCopeBank } from './theme-packs/gachaCopeBank'
import { mobaMeltdownBank } from './theme-packs/mobaMeltdownBank'
import { opsFirefightBank } from './theme-packs/opsFirefightBank'
import { pmChaosBank } from './theme-packs/pmChaosBank'
import { raidDramaBank } from './theme-packs/raidDramaBank'

const allBanks = [
  ...pmChaosBank,
  ...debugBlameBank,
  ...opsFirefightBank,
  ...mobaMeltdownBank,
  ...raidDramaBank,
  ...gachaCopeBank,
]

const sharedQuestionMap: Record<string, ThemePackQuestion> = Object.fromEntries(
  allBanks.map((question) => [question.id, question]),
)

export const themePackQuestions = sharedQuestionMap

export const themePacks: ThemePack[] = [
  {
    id: 'pm-chaos',
    family: 'boundary',
    seedId: 'seed-boundary',
    scene: 'work',
    rhythm: 'judgment',
    tonePacks: ['soft', 'clean', 'sharp', 'observant'],
    themeToken: 'slate',
    voicePackId: 'groupchat',
    memeTags: ['需求群', ...memeLexicon.groupchat.slice(0, 2)],
    questionIds: pmChaosBank.map((question) => question.id),
    outcomePackId: 'outcome-pm-chaos',
    headlineVariants: sameToneTitles(
      buildTitles('这需求到底谁加的？', '这锅最后到底飞给谁？', '谁又半夜改需求了？'),
    ),
    hookVariants: {
      soft: '十道题，看你面对临时加需求时，会先接住、先确认，还是先把范围讲清楚。',
      clean: '从会后补充到半夜改需求，这套题主要看你怎么接、怎么问、怎么拦。',
      sharp: '做完这套，大概能看出你在需求变更时是先接、先问，还是先划线。',
      observant: '需求一变多，有人先接，有人先问，有人先讲范围，这套题只看这个。',
    },
    shareTitle: '这需求到底谁加的？',
    shareSubtitle: '十道题，看你在需求变更时会先接、先问，还是先把范围讲清楚。',
  },
  {
    id: 'debug-blame',
    family: 'exposure',
    seedId: 'seed-exposure',
    scene: 'work',
    rhythm: 'mixed',
    tonePacks: ['soft', 'clean', 'sharp', 'observant'],
    themeToken: 'ink',
    voicePackId: 'groupchat',
    memeTags: ['联调群', '踢皮球', ...memeLexicon.groupchat.slice(1, 3)],
    questionIds: debugBlameBank.map((question) => question.id),
    outcomePackId: 'outcome-debug-blame',
    headlineVariants: sameToneTitles(
      buildTitles('联调卡住了先找谁？', '这锅到底先飞给谁？', '谁那边又动代码了？'),
    ),
    hookVariants: {
      soft: '十道题，看你联调卡住时是先拉人、先查证据，还是先把问题留在自己这边。',
      clean: '从复现、拉人到点名，这套题主要看你遇到联调问题时怎么开口。',
      sharp: '一出问题，你更像先喊人、先找证据，还是先自己查清楚，这套题就看这个。',
      observant: '联调群里最容易看出来的，不只是技术问题，还有谁先喊、谁先查、谁先点名。',
    },
    shareTitle: '联调卡住了先找谁？',
    shareSubtitle: '十道题，看你联调卡住时是先拉人、先查证据，还是先把问题留在自己这边。',
  },
  {
    id: 'ops-firefight',
    family: 'response',
    seedId: 'seed-response',
    scene: 'work',
    rhythm: 'scene',
    tonePacks: ['soft', 'clean', 'sharp', 'observant'],
    themeToken: 'linen',
    voicePackId: 'groupchat',
    memeTags: ['上线群', '硬撑', ...memeLexicon.groupchat.slice(0, 2)],
    questionIds: opsFirefightBank.map((question) => question.id),
    outcomePackId: 'outcome-ops-firefight',
    headlineVariants: sameToneTitles(
      buildTitles('活动上线前到底谁在硬撑？', '上线口到底谁在补位？', '这活怎么又落我头上了？'),
    ),
    hookVariants: {
      soft: '十道题，看你上线前出状况时是先稳场、先补位，还是先排优先级。',
      clean: '从活动救火到流程走偏，这套题主要看你怎么顶、怎么稳、怎么处理。',
      sharp: '上线前一乱起来，你更像先稳场、先补位，还是先把问题拆开，这套题就看这个。',
      observant: '有人救火靠稳场，有人靠补位，也有人先排清楚再动手，这套题会把这几种方式分开。',
    },
    shareTitle: '活动上线前到底谁在硬撑？',
    shareSubtitle: '十道题，看你上线前出状况时是先稳场、先补位，还是先排优先级。',
  },
  {
    id: 'moba-meltdown',
    family: 'response',
    seedId: 'seed-response',
    scene: 'game',
    rhythm: 'scene',
    tonePacks: ['soft', 'clean', 'sharp', 'observant'],
    themeToken: 'ember',
    voicePackId: 'shortvideo',
    memeTags: ['开黑房', ...memeLexicon.shortvideo.slice(0, 3)],
    questionIds: mobaMeltdownBank.map((question) => question.id),
    outcomePackId: 'outcome-moba-meltdown',
    headlineVariants: sameToneTitles(
      buildTitles('逆风局里谁先开始上头？', '这把一逆风你会变成啥？', '到底是谁先红温了？'),
    ),
    hookVariants: {
      soft: '十道题，看你逆风以后会先开口、先指挥，还是先沉默。',
      clean: '从说话方式到情绪波动，这套题主要看你逆风局里会怎么变化。',
      sharp: '队伍一逆风，你更像先提醒队友、先冲出来说，还是先安静下来，这套题就看这个。',
      observant: '逆风局里最容易被看见的，不只是操作，还有谁先急、谁先沉默、谁还在控节奏。',
    },
    shareTitle: '逆风局里谁先开始上头？',
    shareSubtitle: '十道题，看你逆风以后会先开口、先指挥，还是先沉默。',
  },
  {
    id: 'raid-drama',
    family: 'stability',
    seedId: 'seed-stability',
    scene: 'game',
    rhythm: 'judgment',
    tonePacks: ['soft', 'clean', 'sharp', 'observant'],
    themeToken: 'moss',
    voicePackId: 'danmu',
    memeTags: ['固定队', ...memeLexicon.danmu.slice(0, 3)],
    questionIds: raidDramaBank.map((question) => question.id),
    outcomePackId: 'outcome-raid-drama',
    headlineVariants: sameToneTitles(
      buildTitles('团灭三次后先点谁？', '这把炸了以后谁先开口？', '固定队翻车后你先干嘛？'),
    ),
    hookVariants: {
      soft: '十道题，看你团灭以后是先继续打、先指出问题，还是先复盘。',
      clean: '从团灭后的第一句话到是否要复盘，这套题主要看你怎么处理翻车。',
      sharp: '一连灭几次以后，你更像先继续、先点问题，还是先开复盘，这套题就看这个。',
      observant: '固定队翻车以后，最容易看出来的是谁先开口、谁先忍住、谁已经开始复盘。',
    },
    shareTitle: '团灭三次后先点谁？',
    shareSubtitle: '十道题，看你团灭以后是先继续打、先指出问题，还是先复盘。',
  },
  {
    id: 'gacha-cope',
    family: 'exposure',
    seedId: 'seed-exposure',
    scene: 'game',
    rhythm: 'mixed',
    tonePacks: ['soft', 'clean', 'sharp', 'observant'],
    themeToken: 'berry',
    voicePackId: 'shortvideo',
    memeTags: ['卡池', ...memeLexicon.shortvideo.slice(1, 4)],
    questionIds: gachaCopeBank.map((question) => question.id),
    outcomePackId: 'outcome-gacha-cope',
    headlineVariants: sameToneTitles(
      buildTitles('又歪了之后你会变成啥？', '这次歪卡你还装得住吗？', '歪了以后你先嘴硬还是先补？'),
    ),
    hookVariants: {
      soft: '十道题，看你歪卡以后是先缓一缓、先嘴硬，还是继续补。',
      clean: '从继续投入到情绪外露，这套题主要看你歪卡之后怎么处理那一口气。',
      sharp: '歪卡以后，你更像先缓、先装没事，还是继续补，这套题就看这个。',
      observant: '抽卡最容易看出来的，不只是运气，还有歪了以后你会怎么收拾自己的状态。',
    },
    shareTitle: '又歪了之后你会变成啥？',
    shareSubtitle: '十道题，看你歪卡以后是先缓一缓、先嘴硬，还是继续补。',
  },
]
