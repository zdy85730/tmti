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
      soft: '十道题，看你在需求群里最后背哪种锅。',
      clean: '从临时加需求到版本大改，这套题只看你怎么接、怎么分锅。',
      sharp: '做完这套，群里会更快知道你是先接还是先拦。',
      observant: '需求一乱，有人先补锅，有人先画线，这套题就看这个。',
    },
    shareTitle: '这需求到底谁加的？',
    shareSubtitle: '十道题，看你在需求群里最后背哪种锅。',
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
      soft: '十道题，看你在联调群里是先查日志、先喊人，还是先背一点。',
      clean: '从复现、拉人到点名，这套题只看你卡 bug 时怎么开麦。',
      sharp: '一出 bug 你是先点名还是先埋头，这套题会很快把味道做出来。',
      observant: '联调群最容易暴露的，不是技术，是谁先喊、谁先甩、谁先查。',
    },
    shareTitle: '联调卡住了先找谁？',
    shareSubtitle: '做完这套，大家会更快知道你是日志派还是弹射派。',
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
      soft: '做完这套，基本能看出来你上线周是先顶场、先暖场，还是先排雷。',
      clean: '从活动救火到流程崩边，这套题只看你怎么顶、怎么稳、怎么扛。',
      sharp: '上线前人一乱，谁在硬撑谁在补位，这套题专门拆这个。',
      observant: '有的人救火靠气氛，有的人靠补位，这套题把这两种劲拆开看。',
    },
    shareTitle: '活动上线前到底谁在硬撑？',
    shareSubtitle: '十道题，看你上线周到底是补位派还是发电派。',
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
      soft: '十道题，看你逆风以后是先开麦、先闭麦，还是先红温。',
      clean: '从开麦节奏到上头温度，这套题只看你逆风局的味道怎么变。',
      sharp: '做完这套，队友会更快知道你是冷脸指挥还是开麦战神。',
      observant: '逆风局最藏不住的不是操作，是谁先上头、谁先安静。',
    },
    shareTitle: '逆风局里谁先开始上头？',
    shareSubtitle: '做完这套，你队友大概会懂你为什么一逆风就变味。',
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
      soft: '十道题，看你固定队翻车以后是先装死、先点人，还是先开复盘会。',
      clean: '从团灭后的安静期到重开前那几句，这套题只看你怎么处理翻车。',
      sharp: '做完这套，队友会更快认出你到底是装死派还是复盘怪。',
      observant: '团本里最容易露馅的，不是输出，是翻车后谁先开口、谁先点名。',
    },
    shareTitle: '团灭三次后先点谁？',
    shareSubtitle: '来做十道题，看你在固定队里到底怎么处理翻车。',
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
      soft: '十道题，看你歪卡之后是先破防、先嘴硬，还是先补一井。',
      clean: '从补井冲动到嘴硬程度，这套题只看你歪卡后的真实状态。',
      sharp: '做完这套，朋友会更快知道你是破防王还是许愿池主。',
      observant: '抽卡最藏不住的不是欧非，是歪了以后你到底怎么演。',
    },
    shareTitle: '又歪了之后你会变成啥？',
    shareSubtitle: '十道题，看你歪卡以后到底是嘴硬派还是冲塔派。',
  },
]
