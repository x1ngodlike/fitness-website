import { create } from 'zustand';
import { Challenge, Participant, Essay } from '../types';
import { mockChallenges } from '../data/mockData';

export type EnvMode = 'test' | 'production';

// —— API 地址：开发时用 Vite dev server 反向代理，生产时走同域 /api ——
const API_BASE = '/api';

// —— Token 存储键 ——
const KEY_META = 'challenge-meta-v1';
const KEY_API_TOKEN = 'challenge-api-token';

interface Meta {
  envMode: EnvMode;
  isAdminAuthenticated: boolean;
  adminPassword?: string;
}

const meta: Meta = (() => {
  try {
    const raw = localStorage.getItem(KEY_META);
    return raw ? JSON.parse(raw) : { envMode: 'production' as EnvMode, isAdminAuthenticated: false };
  } catch { return { envMode: 'production' as EnvMode, isAdminAuthenticated: false }; }
})();

export const loadToken = (): string | null => {
  try {
    return localStorage.getItem(KEY_API_TOKEN);
  } catch { return null; }
};

const saveMeta = (payload: Partial<Meta>) => {
  try {
    const current = JSON.parse(localStorage.getItem(KEY_META) || '{}');
    localStorage.setItem(KEY_META, JSON.stringify({ ...current, ...payload }));
  } catch { /* ignore */ }
};

const saveToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(KEY_API_TOKEN, token);
    } else {
      localStorage.removeItem(KEY_API_TOKEN);
    }
  } catch { /* ignore */ }
};

// —— 轻量 fetch wrapper ——
const http = {
  async get<T>(path: string, token?: string | null): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['x-api-token'] = token;
    const res = await fetch(API_BASE + path, { headers });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async post<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['x-api-token'] = token;
    const res = await fetch(API_BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async put<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['x-api-token'] = token;
    const res = await fetch(API_BASE + path, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async delete<T>(path: string, token?: string | null): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers['x-api-token'] = token;
    const res = await fetch(API_BASE + path, { method: 'DELETE', headers });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
};

interface ChallengeStore {
  challenges: Challenge[];
  essays: Essay[];
  isAdminAuthenticated: boolean;
  envMode: EnvMode;
  init: () => Promise<void>;
  authenticateAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  setEnvMode: (mode: EnvMode) => void;
  addChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'participants' | 'essays' | 'isBlocked' | 'status'>) => Promise<void>;
  updateChallenge: (challengeId: string, updates: Partial<Challenge>) => Promise<void>;
  toggleBlock: (challengeId: string) => Promise<void>;
  joinChallenge: (challengeId: string, participantName: string, stake: number, side: 'support' | 'oppose') => Promise<boolean>;
  setChallengeResult: (challengeId: string, hostResult: 'success' | 'failed') => Promise<void>;
  updateParticipant: (challengeId: string, participantId: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (challengeId: string, participantId: string) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;
  getChallengeById: (id: string) => Challenge | undefined;
  addEssay: (essay: Omit<Essay, 'id' | 'createdAt'>) => Promise<void>;
  deleteEssay: (essayId: string) => Promise<void>;
}

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  challenges: [],
  essays: [],
  isAdminAuthenticated: meta.isAdminAuthenticated === true,
  // 本地开发环境默认进入测试模式（避免需要后端API），生产环境默认正式模式
  envMode: import.meta.env.DEV ? 'test' : (meta.envMode === 'test' ? 'test' : 'production'),

  // —— 启动时拉取所有挑战和小作文（正式环境走后端，测试环境走本地 mockData）——
  init: async () => {
    if (get().envMode === 'test') {
      const allEssays: Essay[] = mockChallenges.flatMap((c) => c.essays || []);
      set({ challenges: mockChallenges, essays: allEssays });
      return;
    }
    try {
      const list = await http.get<Challenge[]>('/challenges');
      const arr = Array.isArray(list) ? list : ([] as Challenge[]);
      const essayList = await http.get<Essay[]>('/essays').catch(() => [] as Essay[]);
      const essayArr = Array.isArray(essayList) ? essayList : ([] as Essay[]);
      set({ challenges: arr, essays: essayArr });
    } catch (e) {
      console.error('Failed to load challenges, falling back to test mode:', e);
      // 后端不可用时，自动回退到测试模式（纯静态部署场景）
      const allEssays: Essay[] = mockChallenges.flatMap((c) => c.essays || []);
      set({ challenges: mockChallenges, essays: allEssays, envMode: 'test' });
      saveMeta({ envMode: 'test' });
    }
  },

  authenticateAdmin: async (password) => {
    // 测试环境：不走后端
    if (get().envMode === 'test') {
      // 测试环境也验证密码（本地定义的测试密码）
      const TEST_ADMIN_PASSWORD = '123456';
      if (password !== TEST_ADMIN_PASSWORD) return false;
      set({ isAdminAuthenticated: true });
      saveMeta({ envMode: get().envMode, isAdminAuthenticated: true, adminPassword: password });
      return true;
    }
    
    // 正式环境：向后端验证密码并获取 token
    try {
      // 先验证密码
      const loginRes = await http.post<{ ok: boolean }>('/admin-login', { password });
      if (!loginRes.ok) return false;
      
      // 获取 API Token
      const tokenRes = await http.post<{ token: string }>('/get-token', { password });
      if (!tokenRes.token) return false;
      
      // 存储 token 和密码
      saveToken(tokenRes.token);
      saveMeta({ envMode: get().envMode, isAdminAuthenticated: true, adminPassword: password });
      set({ isAdminAuthenticated: true });
      return true;
    } catch (e) {
      console.error('Authentication failed:', e);
      return false;
    }
  },

  logoutAdmin: () => {
    saveToken(null);
    saveMeta({ envMode: get().envMode, isAdminAuthenticated: false, adminPassword: undefined });
    set({ isAdminAuthenticated: false });
  },

  setEnvMode: (mode) => {
    set({ envMode: mode, isAdminAuthenticated: get().isAdminAuthenticated });
    saveMeta({ envMode: mode, isAdminAuthenticated: get().isAdminAuthenticated });
    // 切换后立刻刷新 challenges
    get().init();
  },

  // —— 测试环境：localState 里变一下，不持久化；正式环境：先调 API 成功后更新 state ——
  addChallenge: async (challengeData) => {
    const mode = get().envMode;
    const newChallenge: Challenge = {
      ...challengeData,
      id: `challenge-${Date.now()}`,
      status: 'active',
      isBlocked: false,
      participants: [],
      essays: [],
      createdAt: Date.now(),
    };
    if (mode === 'test') {
      set((s) => ({ challenges: [...s.challenges, newChallenge] }));
      return;
    }
    try {
      const token = loadToken();
      await http.post('/challenges', newChallenge, token);
      set((s) => ({ challenges: [...s.challenges, newChallenge] }));
    } catch (e) {
      console.error(e);
    }
  },

  updateChallenge: async (challengeId, updates) => {
    const mode = get().envMode;
    set((s) => ({
      challenges: s.challenges.map((c) => c.id === challengeId ? { ...c, ...updates } : c),
    }));
    if (mode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  toggleBlock: async (challengeId) => {
    const mode = get().envMode;
    set((s) => ({
      challenges: s.challenges.map((c) => c.id === challengeId ? { ...c, isBlocked: !c.isBlocked } : c),
    }));
    if (mode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  joinChallenge: async (challengeId, participantName, stake, side) => {
    const challenge = get().challenges.find((c) => c.id === challengeId);
    if (!challenge) return false;
    if (challenge.isBlocked) return false;
    if (challenge.status !== 'active') return false;

    const endOfDay = new Date(challenge.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (endOfDay.getTime() < Date.now()) return false;

    const today = new Date();
    const joinDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const newParticipant: Participant = {
      id: `participant-${Date.now()}`,
      challengeId,
      participantName,
      stake,
      side,
      result: 'pending',
      createdAt: Date.now(),
      joinTime: joinDate,
    };

    if (get().envMode === 'test') {
      set((s) => ({
        challenges: s.challenges.map((c) =>
          c.id === challengeId ? { ...c, participants: [...c.participants, newParticipant] } : c
        ),
      }));
      return true;
    }

    try {
      const token = loadToken();
      const updatedChallenge = {
        ...challenge,
        participants: [...challenge.participants, newParticipant],
      };
      await http.put(`/challenges/${challengeId}`, updatedChallenge, token);

      set((s) => ({
        challenges: s.challenges.map((c) =>
          c.id === challengeId ? { ...c, participants: [...c.participants, newParticipant] } : c
        ),
      }));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  setChallengeResult: async (challengeId, hostResult) => {
    set((s) => ({
      challenges: s.challenges.map((c) => {
        if (c.id !== challengeId) return c;
        const updatedParticipants = c.participants.map((p): Participant => ({
          ...p,
          result: hostResult === 'success'
            ? (p.side === 'support' ? 'win' : 'lose')
            : (p.side === 'support' ? 'lose' : 'win'),
        }));
        return { ...c, participants: updatedParticipants, status: 'completed' };
      }),
    }));
    if (get().envMode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  updateParticipant: async (challengeId, participantId, updates) => {
    set((s) => ({
      challenges: s.challenges.map((c) =>
        c.id === challengeId
          ? { ...c, participants: c.participants.map((p) => p.id === participantId ? { ...p, ...updates } : p) }
          : c
      ),
    }));
    if (get().envMode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  deleteParticipant: async (challengeId, participantId) => {
    set((s) => ({
      challenges: s.challenges.map((c) =>
        c.id === challengeId
          ? { ...c, participants: c.participants.filter((p) => p.id !== participantId) }
          : c
      ),
    }));
    if (get().envMode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  deleteChallenge: async (challengeId) => {
    set((s) => ({
      challenges: s.challenges.filter((c) => c.id !== challengeId),
      essays: s.essays.filter((e) => e.challengeId !== challengeId),
    }));
    if (get().envMode === 'test') return;
    try {
      const token = loadToken();
      await http.delete(`/challenges/${challengeId}`, token);
    } catch (e) { console.error(e); }
  },

  getChallengeById: (id) => get().challenges.find((c) => c.id === id),

  addEssay: async (essayData) => {
    const newEssay: Essay = {
      ...essayData,
      id: `essay-${Date.now()}`,
      createdAt: Date.now(),
    };
    
    set((s) => ({ essays: [...s.essays, newEssay] }));
    
    if (get().envMode === 'test') return;
    try {
      await http.post('/essays', newEssay);
    } catch (e) {
      console.error(e);
    }
  },

  deleteEssay: async (essayId) => {
    set((s) => ({ essays: s.essays.filter((e) => e.id !== essayId) }));
    
    if (get().envMode === 'test') return;
    try {
      const token = loadToken();
      await http.delete(`/essays/${essayId}`, token);
    } catch (e) {
      console.error(e);
    }
  },
}));
