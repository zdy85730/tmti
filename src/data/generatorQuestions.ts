import type { GeneratorQuestion } from '../types'

export const generatorQuestions: GeneratorQuestion[] = [
  {
    id: 'family',
    eyebrow: '方向',
    prompt: '这份问卷先围着哪种主题转，更像你想做的东西？',
    options: [
      { value: 'boundary', label: '边界和分寸', description: '更在意靠近、拒绝、退让的边线。' },
      { value: 'response', label: '回应和热度', description: '更在意谁先回、回到什么程度。' },
      { value: 'stability', label: '状态和切换', description: '更在意人在不同场景里如何保持自己。' },
      { value: 'exposure', label: '误读和暴露', description: '更在意哪些东西会被看见，哪些会被藏起来。' },
    ],
  },
  {
    id: 'scene',
    eyebrow: '场景',
    prompt: '题目更应该从哪种场合里长出来？',
    options: [
      { value: 'relationship', label: '亲密关系', description: '更靠近暧昧、确认、冷下来之后的反应。' },
      { value: 'friendship', label: '朋友和熟人', description: '更像日常聊天、约局、边界感。' },
      { value: 'work', label: '工作和协作', description: '更像职场分工、回复、配合和留白。' },
      { value: 'mixed', label: '混合场景', description: '不限定单一场景，保留一点普适性。' },
    ],
  },
  {
    id: 'tone',
    eyebrow: '语气',
    prompt: '整体语气更接近哪一种？',
    options: [
      { value: 'soft', label: '松一点', description: '像朋友转来的问卷，不刻意绷紧。' },
      { value: 'clean', label: '规整一点', description: '像认真做过排版的问卷，句子干净。' },
      { value: 'sharp', label: '利一点', description: '句子更短，判断更直接。' },
      { value: 'observant', label: '观察一点', description: '像在记人和记场面，带点旁观感。' },
    ],
  },
  {
    id: 'titleStyle',
    eyebrow: '标题',
    prompt: '标题更像哪一类？',
    options: [
      { value: 'plain', label: '像普通问卷', description: '不抢戏，直接把主题说清楚。' },
      { value: 'essay', label: '像一句话题', description: '更像会被转发的中文互联网标题。' },
      { value: 'crisp', label: '像一个整齐名字', description: '更像有明确边界的量表名。' },
    ],
  },
  {
    id: 'rhythm',
    eyebrow: '节奏',
    prompt: '题目更偏向哪种写法？',
    options: [
      { value: 'scene', label: '具体场景', description: '多给情境，再问你会怎么反应。' },
      { value: 'judgment', label: '直接判断', description: '少铺垫，直接问你更像哪句话。' },
      { value: 'mixed', label: '两种都要', description: '既有场景，也有比较干脆的判断题。' },
    ],
  },
  {
    id: 'themeToken',
    eyebrow: '版式',
    prompt: '第一眼色调更想落在哪一边？',
    options: [
      { value: 'linen', label: '暖纸面', description: '偏米色、像整理好的纸页。' },
      { value: 'ink', label: '冷墨面', description: '偏蓝灰，像清冷的记录页。' },
      { value: 'berry', label: '软红面', description: '带点情绪感，但不会太甜。' },
      { value: 'glass', label: '通透面', description: '更轻更亮，像一层磨砂玻璃。' },
    ],
  },
]

