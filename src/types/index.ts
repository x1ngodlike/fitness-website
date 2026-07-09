export interface Participant {
  id: string;
  challengeId: string;
  participantName: string;
  participantId?: string;
  stake: number;
  side: 'support' | 'oppose';
  result: 'win' | 'lose' | 'pending';
  createdAt: number;
  joinTime?: string;
  deleted?: boolean;
}

export interface ParticipantItem {
  id: string;
  name: string;
  avatar?: string;
  isActive: boolean;
  order?: number; // 排序权重，数字越小越靠前
  createdAt: number;
  updatedAt: number;
}

export interface Essay {
  id: string;
  challengeId: string;
  content: string;
  imageUrl?: string;
  sentiment: 'bullish' | 'bearish'; // 利多/利空
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
  maxPayout: number; // 最高赔付金额
  minStake: number; // 最低赔付金额
  status: 'active' | 'pending' | 'completed'; // 进行中/待确认/已结束
  isBlocked: boolean; // 封档标签，只在active状态有效，禁止参与
  participants: Participant[];
  essays: Essay[];
  createdAt: number;
}

export type ChallengeStatus = 'all' | 'active' | 'pending' | 'completed';
