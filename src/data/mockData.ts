import { Challenge } from '../types';

export const mockChallenges: Challenge[] = [
  {
    id: 'mock-1',
    theme: '30天俯卧撑挑战',
    goal: '每天完成 50 个俯卧撑，连续 30 天不间断',
    hostName: '张伟',
    coverImage: '',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 23 * 86400000).toISOString().slice(0, 10),
    maxPayout: 500,
    minStake: 200,
    status: 'active',
    isBlocked: false,
    participants: [
      {
        id: 'mock-p-1',
        participantName: '小李',
        stake: 200,
        side: 'support',
        result: 'pending',
        joinedAt: Date.now() - 5 * 86400000,
      },
      {
        id: 'mock-p-2',
        participantName: '老王',
        stake: 300,
        side: 'oppose',
        result: 'pending',
        joinedAt: Date.now() - 3 * 86400000,
      },
    ],
    createdAt: Date.now() - 10 * 86400000,
  },
];
