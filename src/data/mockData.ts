import { Challenge } from '../types';

const now = Date.now();
const day = 86400000;

// 模拟小作文数据
const mockEssays = [
  // mock-1: 30天俯卧撑挑战
  {
    id: 'essay-1',
    challengeId: 'mock-1',
    content: '今天完成了第7天！感觉胸肌已经开始酸痛了，但是坚持就是胜利！💪 每天50个俯卧撑，一定要坚持下去！',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 1 * day,
  },
  {
    id: 'essay-2',
    challengeId: 'mock-1',
    content: '最近工作太忙了，感觉有点坚持不住了...但是一想到押金，还是咬咬牙做完了今天的50个。希望能坚持下去！',
    sentiment: 'bearish' as const,  // 利空 - 绿色
    createdAt: now - 2 * day,
  },
  {
    id: 'essay-3',
    challengeId: 'mock-1',
    content: '第三天打卡！今天状态不错，一口气做了60个！超越目标的感觉真爽！💪',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 4 * day,
  },
  // mock-2: 21天早起挑战
  {
    id: 'essay-4',
    challengeId: 'mock-2',
    content: '早起的鸟儿有虫吃！坚持了5天6点前起床，感觉一天的时间变多了，整个人精神状态也好了很多。闹钟调好了，明天继续加油！',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 2 * day,
  },
  {
    id: 'essay-5',
    challengeId: 'mock-2',
    content: '今天差点睡过头了...闹钟响了没听到，差点错过打卡。好险！明天得早点睡。',
    sentiment: 'bearish' as const,  // 利空 - 绿色
    createdAt: now - 5 * day,
  },
  // mock-3: 100天跑步挑战
  {
    id: 'essay-6',
    challengeId: 'mock-3',
    content: '100天跑步挑战圆满完成！累计跑步300公里，完成了年初定下的目标。感谢所有支持我的小伙伴们！🏃‍♂️',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 5 * day,
  },
  {
    id: 'essay-7',
    challengeId: 'mock-3',
    content: '第50天！已经跑了150公里，完成一半了！继续加油，争取提前完成目标！',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 55 * day,
  },
  // mock-4: 30天戒酒挑战
  {
    id: 'essay-8',
    challengeId: 'mock-4',
    content: '唉，还是没忍住...朋友聚会喝了几杯，挑战失败了。下次一定更加努力！',
    sentiment: 'bearish' as const,  // 利空 - 绿色
    createdAt: now - 3 * day,
  },
  {
    id: 'essay-9',
    challengeId: 'mock-4',
    content: '坚持了25天！马上就要成功了，加油加油！今晚朋友聚餐我一定忍住！',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 5 * day,
  },
  // mock-5: 7天阅读挑战
  {
    id: 'essay-10',
    challengeId: 'mock-5',
    content: '已经读了一半了，这本书真的很好看！学到了很多新知识。',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 3 * day,
  },
  // mock-6: 14天减肥挑战
  {
    id: 'essay-11',
    challengeId: 'mock-6',
    content: '挑战第一天！制定了详细的饮食和运动计划，希望能成功减重2公斤！',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 1 * day,
  },
  // mock-7: 60天健身挑战
  {
    id: 'essay-12',
    challengeId: 'mock-7',
    content: '健身房第一次请了私教，感觉动作标准多了。60天健身挑战才刚开始，我已经迫不及待想看到效果了！',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 1 * day,
  },
  {
    id: 'essay-13',
    challengeId: 'mock-7',
    content: '训练完第二天全身酸痛，感觉腿都不是自己的了。但是看到镜子里的自己，觉得一切都值得！💪',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 6 * day,
  },
  {
    id: 'essay-14',
    challengeId: 'mock-7',
    content: '一周训练下来，感觉体能明显提升了！深蹲重量从40kg增加到50kg了！',
    sentiment: 'bullish' as const,  // 利多 - 红色
    createdAt: now - 10 * day,
  },
];

export const mockChallenges: Challenge[] = [
  // 1. 进行中的挑战（7/30天）- 底仓200
  {
    id: 'mock-1',
    theme: '30天俯卧撑挑战',
    goal: '每天完成 50 个俯卧撑，连续 30 天不间断',
    hostName: '张伟',
    coverImage: '',
    startDate: new Date(now - 7 * day).toISOString().slice(0, 10),
    endDate: new Date(now + 23 * day).toISOString().slice(0, 10),
    maxPayout: 500,
    minStake: 200,
    status: 'active',
    isBlocked: false,
    participants: [
      {
        id: 'mock-p-1',
        challengeId: 'mock-1',
        participantName: '小李',
        stake: 200,
        side: 'support',
        result: 'pending',
        createdAt: now - 5 * day,
        joinTime: new Date(now - 5 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-2',
        challengeId: 'mock-1',
        participantName: '老王',
        stake: 300,
        side: 'oppose',
        result: 'pending',
        createdAt: now - 3 * day,
        joinTime: new Date(now - 3 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-3',
        challengeId: 'mock-1',
        participantName: '阿明',
        stake: 500,
        side: 'support',
        result: 'pending',
        createdAt: now - 2 * day,
        joinTime: new Date(now - 2 * day).toISOString().slice(0, 10),
      },
    ],
    essays: mockEssays.filter(e => e.challengeId === 'mock-1'),
    createdAt: now - 10 * day,
  },

  // 2. 进行中的挑战 - 底仓100，封档状态
  {
    id: 'mock-2',
    theme: '21天早起挑战',
    goal: '每天早上6点前起床打卡，连续21天',
    hostName: '早起达人',
    coverImage: '',
    startDate: new Date(now - 10 * day).toISOString().slice(0, 10),
    endDate: new Date(now + 11 * day).toISOString().slice(0, 10),
    maxPayout: 1000,
    minStake: 100,
    status: 'active',
    isBlocked: true, // 封档中
    participants: [
      {
        id: 'mock-p-4',
        challengeId: 'mock-2',
        participantName: '小张',
        stake: 100,
        side: 'support',
        result: 'pending',
        createdAt: now - 8 * day,
        joinTime: new Date(now - 8 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-5',
        challengeId: 'mock-2',
        participantName: '小红',
        stake: 200,
        side: 'oppose',
        result: 'pending',
        createdAt: now - 5 * day,
        joinTime: new Date(now - 5 * day).toISOString().slice(0, 10),
      },
    ],
    essays: mockEssays.filter(e => e.challengeId === 'mock-2'),
    createdAt: now - 12 * day,
  },

  // 3. 已结束 - 挑战者成功，支持者赢
  {
    id: 'mock-3',
    theme: '100天跑步挑战',
    goal: '每天跑步3公里，100天内完成300公里',
    hostName: '跑步爱好者',
    coverImage: '',
    startDate: new Date(now - 105 * day).toISOString().slice(0, 10),
    endDate: new Date(now - 5 * day).toISOString().slice(0, 10),
    maxPayout: 2000,
    minStake: 200,
    status: 'completed',
    isBlocked: false,
    participants: [
      {
        id: 'mock-p-6',
        challengeId: 'mock-3',
        participantName: '健身达人',
        stake: 500,
        side: 'support',
        result: 'win', // 赢了
        createdAt: now - 100 * day,
        joinTime: new Date(now - 100 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-7',
        challengeId: 'mock-3',
        participantName: '小明',
        stake: 300,
        side: 'support',
        result: 'win',
        createdAt: now - 95 * day,
        joinTime: new Date(now - 95 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-8',
        challengeId: 'mock-3',
        participantName: '小刘',
        stake: 400,
        side: 'oppose',
        result: 'lose', // 输了
        createdAt: now - 90 * day,
        joinTime: new Date(now - 90 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-9',
        challengeId: 'mock-3',
        participantName: '小陈',
        stake: 600,
        side: 'oppose',
        result: 'lose',
        createdAt: now - 85 * day,
        joinTime: new Date(now - 85 * day).toISOString().slice(0, 10),
      },
    ],
    essays: mockEssays.filter(e => e.challengeId === 'mock-3'),
    createdAt: now - 108 * day,
  },

  // 4. 已结束 - 挑战者失败，反对者赢
  {
    id: 'mock-4',
    theme: '30天戒酒挑战',
    goal: '连续30天不饮酒',
    hostName: '健康生活',
    coverImage: '',
    startDate: new Date(now - 35 * day).toISOString().slice(0, 10),
    endDate: new Date(now - 3 * day).toISOString().slice(0, 10),
    maxPayout: 800,
    minStake: 150,
    status: 'completed',
    isBlocked: false,
    participants: [
      {
        id: 'mock-p-10',
        challengeId: 'mock-4',
        participantName: '小周',
        stake: 200,
        side: 'support',
        result: 'lose',
        createdAt: now - 30 * day,
        joinTime: new Date(now - 30 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-11',
        challengeId: 'mock-4',
        participantName: '老李',
        stake: 300,
        side: 'oppose',
        result: 'win',
        createdAt: now - 28 * day,
        joinTime: new Date(now - 28 * day).toISOString().slice(0, 10),
      },
    ],
    essays: mockEssays.filter(e => e.challengeId === 'mock-4'),
    createdAt: now - 38 * day,
  },

  // 5. 待确认状态 - 已过期但未结算
  {
    id: 'mock-5',
    theme: '7天阅读挑战',
    goal: '7天内读完一本书',
    hostName: '书虫',
    coverImage: '',
    startDate: new Date(now - 8 * day).toISOString().slice(0, 10),
    endDate: new Date(now - 1 * day).toISOString().slice(0, 10),
    maxPayout: 300,
    minStake: 100,
    status: 'active', // 仍然是active但已过期，待确认
    isBlocked: false,
    participants: [
      {
        id: 'mock-p-12',
        challengeId: 'mock-5',
        participantName: '读书人',
        stake: 100,
        side: 'support',
        result: 'pending',
        createdAt: now - 6 * day,
        joinTime: new Date(now - 6 * day).toISOString().slice(0, 10),
      },
    ],
    essays: mockEssays.filter(e => e.challengeId === 'mock-5'),
    createdAt: now - 9 * day,
  },

  // 6. 新挑战 - 刚开始，暂无参与者
  {
    id: 'mock-6',
    theme: '14天减肥挑战',
    goal: '14天内减重2公斤',
    hostName: '健身教练',
    coverImage: '',
    startDate: new Date(now - 1 * day).toISOString().slice(0, 10),
    endDate: new Date(now + 13 * day).toISOString().slice(0, 10),
    maxPayout: 600,
    minStake: 200,
    status: 'active',
    isBlocked: false,
    participants: [], // 暂无参与者
    essays: mockEssays.filter(e => e.challengeId === 'mock-6'),
    createdAt: now - 2 * day,
  },

  // 7. 大额挑战 - 底仓500
  {
    id: 'mock-7',
    theme: '60天健身挑战',
    goal: '每周健身4次，60天内完成24次训练',
    hostName: '私人教练',
    coverImage: '',
    startDate: new Date(now - 15 * day).toISOString().slice(0, 10),
    endDate: new Date(now + 45 * day).toISOString().slice(0, 10),
    maxPayout: 5000,
    minStake: 500,
    status: 'active',
    isBlocked: false,
    participants: [
      {
        id: 'mock-p-13',
        challengeId: 'mock-7',
        participantName: '运动爱好者',
        stake: 1000,
        side: 'support',
        result: 'pending',
        createdAt: now - 10 * day,
        joinTime: new Date(now - 10 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-14',
        challengeId: 'mock-7',
        participantName: '健身新手',
        stake: 500,
        side: 'oppose',
        result: 'pending',
        createdAt: now - 8 * day,
        joinTime: new Date(now - 8 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-15',
        challengeId: 'mock-7',
        participantName: '跑步达人',
        stake: 2000,
        side: 'support',
        result: 'pending',
        createdAt: now - 5 * day,
        joinTime: new Date(now - 5 * day).toISOString().slice(0, 10),
      },
      {
        id: 'mock-p-16',
        challengeId: 'mock-7',
        participantName: '瑜伽爱好者',
        stake: 800,
        side: 'oppose',
        result: 'pending',
        createdAt: now - 3 * day,
        joinTime: new Date(now - 3 * day).toISOString().slice(0, 10),
      },
    ],
    essays: mockEssays.filter(e => e.challengeId === 'mock-7'),
    createdAt: now - 18 * day,
  },
];
