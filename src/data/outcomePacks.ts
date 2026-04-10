import type { OutcomePack } from '../types'

export const outcomePacks: OutcomePack[] = [
  {
    id: 'outcome-boundary',
    family: 'boundary',
    axes: [
      { id: 'pace', label: '靠近节奏', lowLabel: '先留白', highLabel: '先接住' },
      { id: 'line', label: '边界表达', lowLabel: '柔着说', highLabel: '直接立线' },
    ],
    outcomes: [
      {
        id: 'boundary-soft-space',
        key: ['low', 'low'],
        title: '留白型分寸',
        summary: '你会先给场面一点缓冲，再决定要不要把线说清楚。',
        bullets: ['不喜欢一上来就把话说满', '更擅长用节奏而不是硬边界表达态度', '靠近和退后都留一点余地'],
      },
      {
        id: 'boundary-clear-space',
        key: ['low', 'high'],
        title: '分寸先行',
        summary: '你不急着热起来，但边线很清楚，靠近之前先把轮廓整理好。',
        bullets: ['靠近之前先看分寸', '提醒和拒绝都比较直接', '稳定感来自线被看见'],
      },
      {
        id: 'boundary-soft-catch',
        key: ['high', 'low'],
        title: '先接住再整理',
        summary: '你愿意先把连接接上，边界不是没有，只是通常在后面补上。',
        bullets: ['先保连接感', '不急着显得太有距离', '等场面稳定后再调整分寸'],
      },
      {
        id: 'boundary-clear-catch',
        key: ['high', 'high'],
        title: '热络但有线',
        summary: '你可以很快进入关系，但不会因为热络就把边线放掉。',
        bullets: ['愿意先靠近', '边界表达不拖泥带水', '既能接住，也能收回来'],
      },
    ],
  },
  {
    id: 'outcome-response',
    family: 'response',
    axes: [
      { id: 'speed', label: '回应速度', lowLabel: '慢一点', highLabel: '快一点' },
      { id: 'warmth', label: '情绪热度', lowLabel: '收一点', highLabel: '放一点' },
    ],
    outcomes: [
      {
        id: 'response-cool-late',
        key: ['low', 'low'],
        title: '留白观察型',
        summary: '你会把节奏放慢一点，也不急着把情绪一下子摆上来。',
        bullets: ['更习惯先看一看', '不会靠高频互动证明在意', '热度和节奏都偏克制'],
      },
      {
        id: 'response-warm-late',
        key: ['low', 'high'],
        title: '慢热表达型',
        summary: '你不会立刻跟上节奏，但一旦进入状态，情绪表达其实并不低。',
        bullets: ['回得不一定快', '在意时会给出明显反馈', '热度来得比速度更先被看见'],
      },
      {
        id: 'response-cool-fast',
        key: ['high', 'low'],
        title: '节奏稳定型',
        summary: '你很会接住聊天，但不靠过量情绪维持连接。',
        bullets: ['回复比较及时', '更擅长用稳定而不是热闹表达在意', '不会轻易把热度拉太满'],
      },
      {
        id: 'response-warm-fast',
        key: ['high', 'high'],
        title: '热源型',
        summary: '你会很快把聊天带起来，也愿意让情绪在互动里直接出现。',
        bullets: ['接话速度快', '热度表达比较明显', '连接感会在互动里被迅速建立'],
      },
    ],
  },
  {
    id: 'outcome-stability',
    family: 'stability',
    axes: [
      { id: 'core', label: '主线感', lowLabel: '更流动', highLabel: '更稳定' },
      { id: 'switch', label: '切换能力', lowLabel: '切换慢', highLabel: '切换快' },
    ],
    outcomes: [
      {
        id: 'stability-fluid-slow',
        key: ['low', 'low'],
        title: '环境共振型',
        summary: '你对场面很敏感，会跟着环境一起走，主线感不会太早定死。',
        bullets: ['容易被场面带动', '不急着给自己固定说法', '稳定感更多来自环境而不是内核'],
      },
      {
        id: 'stability-fluid-fast',
        key: ['low', 'high'],
        title: '场景切换型',
        summary: '你很会切场景，版本切得快，但并不急着用一个统一说法概括自己。',
        bullets: ['适应能力强', '不同圈子里的版本切换自然', '主线感相对开放'],
      },
      {
        id: 'stability-core-slow',
        key: ['high', 'low'],
        title: '内核稳场型',
        summary: '你的主线感很清楚，即使切换不快，也不太会被场面带着改掉核心。',
        bullets: ['核心版本稳定', '变化不会轻易动到主线', '切换时更像慢慢调节'],
      },
      {
        id: 'stability-core-fast',
        key: ['high', 'high'],
        title: '多场景稳定型',
        summary: '你既有明确主线，也有很好的切换能力，不同场合像同一个人伸出不同侧面。',
        bullets: ['主线清楚', '切换自然', '不会为了适应把自己换掉'],
      },
    ],
  },
  {
    id: 'outcome-exposure',
    family: 'exposure',
    axes: [
      { id: 'sensitivity', label: '误读敏感度', lowLabel: '扛得住', highLabel: '很在意' },
      { id: 'directness', label: '表达直接度', lowLabel: '先收着', highLabel: '先说明' },
    ],
    outcomes: [
      {
        id: 'exposure-quiet-steady',
        key: ['low', 'low'],
        title: '轻收着型',
        summary: '你不太会被误读轻易带跑，也不急着把想法全部摊开。',
        bullets: ['对误读的容忍度比较高', '表达有控制感', '不需要每次都把话补满'],
      },
      {
        id: 'exposure-clear-steady',
        key: ['low', 'high'],
        title: '不绕弯型',
        summary: '你能扛住别人的理解偏差，但如果值得说清楚，也会直接给出自己的版本。',
        bullets: ['解释成本判断清楚', '表达不太绕', '不会因为怕误读而把话缩得太紧'],
      },
      {
        id: 'exposure-quiet-sensitive',
        key: ['high', 'low'],
        title: '容易被读错型',
        summary: '你对误读很敏感，但不一定会立刻解释，更多时候是先把自己收回去一点。',
        bullets: ['在意别人读到什么', '解释前会犹豫', '容易先收住而不是先说开'],
      },
      {
        id: 'exposure-clear-sensitive',
        key: ['high', 'high'],
        title: '先解释型',
        summary: '你很难无视误读，一旦觉得偏差太大，通常会主动把自己的意思补上。',
        bullets: ['误读容忍度低', '有明显解释冲动', '更希望把版本说清楚再继续'],
      },
    ],
  },
]

