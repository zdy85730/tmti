import type { QuestionOutcomeConfig } from '../types'

const publicRegular: QuestionOutcomeConfig = {
  coverTokens: {
    1: ['留白', '不抢先定义自己'],
    2: ['说话留余地', '会修整说法'],
    3: ['顺手体面', '公开感强', '说法稳当'],
  },
  candidateHints: {
    1: ['VEIL', 'LATE'],
    2: ['BUFFER', 'MIRROR'],
    3: ['FRAME', 'STEADY', 'MIRROR'],
  },
  priorityWeights: {
    1: 1,
    2: 2,
    3: 3,
  },
}

const publicPreference: QuestionOutcomeConfig = {
  ...publicRegular,
  candidateHints: {
    1: ['VEIL', 'LATE'],
    2: ['BUFFER', 'MIRROR', 'CLEAR'],
    3: ['FRAME', 'STEADY', 'CLEAR'],
  },
  priorityWeights: {
    1: 1,
    2: 3,
    3: 5,
  },
}

const boundaryRegular: QuestionOutcomeConfig = {
  coverTokens: {
    1: ['会接住氛围', '好接近'],
    2: ['会先观察', '说话留余地'],
    3: ['边界清楚', '边界感明确', '克制'],
  },
  candidateHints: {
    1: ['BUFFER', 'ECHO', 'LATE'],
    2: ['MIRROR', 'VEIL', 'BUFFER'],
    3: ['STEADY', 'FRAME', 'CLEAR'],
  },
  priorityWeights: {
    1: 1,
    2: 2,
    3: 3,
  },
}

const boundaryPreference: QuestionOutcomeConfig = {
  ...boundaryRegular,
  candidateHints: {
    1: ['BUFFER', 'ECHO'],
    2: ['VEIL', 'LATE'],
    3: ['STEADY', 'FRAME', 'CLEAR'],
  },
  priorityWeights: {
    1: 1,
    2: 3,
    3: 5,
  },
}

const stabilityRegular: QuestionOutcomeConfig = {
  coverTokens: {
    1: ['敏感但不吵', '会摇摆'],
    2: ['看起来稳定', '会修整说法'],
    3: ['自我叙述稳定', '说法稳当', '清楚'],
  },
  candidateHints: {
    1: ['ECHO', 'MIRROR'],
    2: ['BUFFER', 'LATE', 'MIRROR'],
    3: ['CLEAR', 'STEADY', 'FRAME'],
  },
  priorityWeights: {
    1: 1,
    2: 2,
    3: 3,
  },
}

const stabilityPreference: QuestionOutcomeConfig = {
  ...stabilityRegular,
  candidateHints: {
    1: ['ECHO', 'MIRROR'],
    2: ['MIRROR', 'BUFFER', 'LATE'],
    3: ['CLEAR', 'STEADY', 'FRAME'],
  },
  priorityWeights: {
    1: 1,
    2: 3,
    3: 5,
  },
}

const exposureRegular: QuestionOutcomeConfig = {
  cutTokens: {
    1: ['也会想解释', '直接表达'],
    2: ['并非完全不在意', '需要外部反馈'],
    3: ['怕被误解', '想确认关系', '需要被确认'],
  },
  candidateHints: {
    1: ['FRAME', 'STEADY'],
    2: ['VEIL', 'MIRROR', 'BUFFER'],
    3: ['CLEAR', 'ECHO', 'LATE'],
  },
}

export const questionOutcomeMap: Record<string, QuestionOutcomeConfig> = {
  q1: publicRegular,
  q2: boundaryRegular,
  q3: stabilityRegular,
  q4: exposureRegular,
  q5: publicRegular,
  q6: boundaryRegular,
  q7: stabilityRegular,
  q8: exposureRegular,
  q9: publicPreference,
  q10: boundaryPreference,
  q11: stabilityPreference,
  q12: exposureRegular,
  q13: {
    ...publicPreference,
    conflictCue: '公开说法',
  },
  q14: {
    ...boundaryRegular,
    conflictCue: '靠近节奏',
  },
  q15: {
    ...stabilityRegular,
    conflictCue: '自我说法',
  },
  q16: {
    ...exposureRegular,
    conflictCue: '回应暴露',
  },
  q17: publicPreference,
  q18: boundaryPreference,
  q19: stabilityRegular,
  q20: exposureRegular,
  q21: publicRegular,
  q22: boundaryRegular,
  q23: stabilityRegular,
  q24: exposureRegular,
}
