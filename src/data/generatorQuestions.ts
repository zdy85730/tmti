import type { GeneratorQuestion } from '../types'

export const generatorQuestions: GeneratorQuestion[] = [
  {
    id: 'family',
    eyebrow: '方向',
    prompt: '以下哪类主题更适合作为这套测试的主线？',
    options: [
      { value: 'boundary', label: '边界和分工', description: '更关注谁来接、谁来扛，以及边界怎么说清楚。' },
      { value: 'response', label: '反应和节奏', description: '更关注人一多、事一急时，大家会怎么接话和推进。' },
      { value: 'stability', label: '翻车后的处理方式', description: '更关注出问题以后，是先装死、先点人，还是先复盘。' },
      { value: 'exposure', label: '情绪和补救反应', description: '更关注歪卡、联调、误会这类情境里，人会怎么表现。' },
    ],
  },
  {
    id: 'scene',
    eyebrow: '场景',
    prompt: '题目主要想放在哪类场景里？',
    options: [
      { value: 'work', label: '工作场景', description: '比如需求群、联调、上线前后这种比较具体的工作场面。' },
      { value: 'game', label: '游戏场景', description: '比如开黑、团本、抽卡之后这种比较具体的游戏场面。' },
      { value: 'mixed', label: '混合场景', description: '不先限定，让系统在工作和游戏里一起挑。' },
    ],
  },
  {
    id: 'tone',
    eyebrow: '语气',
    prompt: '整体语气更接近哪一种？',
    options: [
      { value: 'soft', label: '轻松一点', description: '像朋友转来的测试，读起来没有太强的攻击性。' },
      { value: 'clean', label: '自然一点', description: '句子更顺，不太像刻意堆梗。' },
      { value: 'sharp', label: '直接一点', description: '表达更短、更明确，但仍然是正常中文。' },
      { value: 'observant', label: '旁观一点', description: '像在描述一个场面，带一点观察感。' },
    ],
  },
  {
    id: 'titleStyle',
    eyebrow: '标题',
    prompt: '标题更接近哪种写法？',
    options: [
      { value: 'plain', label: '直接提问', description: '像“这需求到底谁加的？”这种一眼能懂的问句。' },
      { value: 'essay', label: '更口语一点', description: '更像聊天里会自然冒出来的一句话。' },
      { value: 'crisp', label: '情绪更明显', description: '带一点情绪，但仍然保持正常表达。' },
    ],
  },
  {
    id: 'rhythm',
    eyebrow: '节奏',
    prompt: '题目展开方式更接近哪一种？',
    options: [
      { value: 'scene', label: '具体场景为主', description: '多给情境，再看人会怎么反应。' },
      { value: 'judgment', label: '判断句为主', description: '少铺垫，直接看更像哪句话。' },
      { value: 'mixed', label: '两种结合', description: '既有具体场景，也有比较直接的判断句。' },
    ],
  },
  {
    id: 'themeToken',
    eyebrow: '版式',
    prompt: '页面视觉更接近哪一种？',
    options: [
      { value: 'linen', label: '暖色纸面', description: '像整理好的纸页，整体比较平和。' },
      { value: 'ink', label: '冷色记录页', description: '更像记录页，适合工作场景。' },
      { value: 'berry', label: '偏情绪一些', description: '更适合抽卡、开黑这种起伏更明显的题。' },
      { value: 'glass', label: '更轻更亮', description: '整体更通透，适合偏轻松的测试。' },
    ],
  },
]
