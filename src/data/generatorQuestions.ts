import type { GeneratorQuestion } from '../types'

export const generatorQuestions: GeneratorQuestion[] = [
  {
    id: 'family',
    eyebrow: '方向',
    prompt: '这次更想整哪种局？',
    options: [
      { value: 'boundary', label: '先分锅还是先立线', description: '更像需求群、翻车局里谁先把边界拉起来。' },
      { value: 'response', label: '谁先开麦谁先顶', description: '更像上线周、逆风局里谁先把场子接住。' },
      { value: 'stability', label: '翻车后怎么处理残局', description: '更像固定队那种团灭以后谁先装死、谁先复盘。' },
      { value: 'exposure', label: '嘴硬和甩锅哪边更重', description: '更像联调群、抽卡群里那种扛不扛得住。' },
    ],
  },
  {
    id: 'scene',
    eyebrow: '场子',
    prompt: '这套更想从哪种场子里长出来？',
    options: [
      { value: 'work', label: '职场背锅局', description: '更像需求群、联调群、上线群里那种互相盯着的气氛。' },
      { value: 'game', label: '游戏发病局', description: '更像开黑、团本、抽卡之后那种一眼就懂的状态。' },
      { value: 'mixed', label: '两边都来点', description: '不想只锁一个圈，先让系统在这批局里自由挑。' },
    ],
  },
  {
    id: 'tone',
    eyebrow: '语气',
    prompt: '嘴上更想往哪种味走？',
    options: [
      { value: 'soft', label: '群聊嘴碎', description: '像朋友半夜甩来的那种顺口吐槽。' },
      { value: 'clean', label: '损得顺一点', description: '句子还是干净，但已经不是正经报告腔。' },
      { value: 'sharp', label: '短视频发病', description: '更短、更冲，像一句话就能把味带出来。' },
      { value: 'observant', label: '弹幕区阴阳', description: '像旁观的人在边上记笔记，顺手来一句。' },
    ],
  },
  {
    id: 'titleStyle',
    eyebrow: '标题',
    prompt: '标题更像哪种开场？',
    options: [
      { value: 'plain', label: '直接发问', description: '像“这需求到底谁加的？”这种一眼进场的问句。' },
      { value: 'essay', label: '群里破案', description: '更像“这锅最后飞给谁？”这种群聊标题。' },
      { value: 'crisp', label: '更炸一点', description: '更像“谁又半夜改需求了？”这种带情绪的开场。' },
    ],
  },
  {
    id: 'rhythm',
    eyebrow: '节奏',
    prompt: '题目更想怎么往前推？',
    options: [
      { value: 'scene', label: '具体翻车现场', description: '多给局面，再看你会先开口、先装死还是先补锅。' },
      { value: 'judgment', label: '一句话开怼', description: '少铺垫，直接看你更认哪句。' },
      { value: 'mixed', label: '两种都来', description: '既有具体现场，也有能一眼认领的判断句。' },
    ],
  },
  {
    id: 'themeToken',
    eyebrow: '版式',
    prompt: '第一眼看上去更想落在哪种纸面？',
    options: [
      { value: 'linen', label: '暖纸板', description: '像群里传来的一张旧纸页，顺手就能点开。' },
      { value: 'ink', label: '冷墨板', description: '更像凌晨还在联调的记录页。' },
      { value: 'berry', label: '发热板', description: '适合抽卡、红温、嘴硬这种带点情绪的局。' },
      { value: 'glass', label: '亮面板', description: '更轻更亮，适合偏整活的测试。' },
    ],
  },
]
