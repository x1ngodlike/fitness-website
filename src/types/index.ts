export interface Participant {
  id: string;
  challengeId: string;
  participantName: string;
  stake: number;
  side: 'support' | 'oppose'; // support=能, oppose=不能
  result: 'win' | 'lose' | 'pending';
  createdAt: number;
}

export interface Challenge {
  id: string;
  theme: string;
  goal: string;
  hostName: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  maxPayout: number; // 通赔金额
  minStake: number; // 底仓金额
  status: 'active' | 'pending' | 'completed'; // 进行中/待确认/已结束
  isBlocked: boolean; // 封档标签，只在active状态有效，禁止参与
  participants: Participant[];
  createdAt: number;
}

export type ChallengeStatus = 'all' | 'active' | 'pending' | 'completed';

export const ADMIN_PASSWORD = '159357';
