import { create } from 'zustand';
import { Challenge, Participant, ADMIN_PASSWORD } from '../types';
import { mockChallenges } from '../data/mockData';

export type EnvMode = 'test' | 'production';

// —— API 地址：开发时用 Vite dev server 反向代理，生产时走同域 /api ——
const API_BASE = '/api';

// —— 轻量 fetch wrapper ——
const http = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(API_BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
  async delete<T>(path: string): Promise<T> {
    const res = await fetch(API_BASE + path, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },
};

interface ChallengeStore {
  challenges: Challenge[];
  isAdminAuthenticated: boolean;
  envMode: EnvMode;
  init: () => Promise<void>;
  authenticateAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  setEnvMode: (mode: EnvMode) => void;
  addChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'participants' | 'isBlocked' | 'status'>) => Promise<void>;
  updateChallenge: (challengeId: string, updates: Partial<Challenge>) => Promise<void>;
  toggleBlock: (challengeId: string) => Promise<void>;
  joinChallenge: (challengeId: string, participantName: string, stake: number, side: 'support' | 'oppose') => Promise<boolean>;
  setChallengeResult: (challengeId: string, hostResult: 'success' | 'failed') => Promise<void>;
  updateParticipant: (challengeId: string, participantId: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (challengeId: string, participantId: string) => Promise<void>;
  getChallengeById: (id: string) => Challenge | undefined;
}

// —— 登录态和环境模式放 localStorage（浏览器侧偏好），挑战数据放后端 db.json ——
const KEY_META = 'challenge-meta-v1';
const meta = (() => {
  try {
    const raw = localStorage.getItem(KEY_META);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
})();
const saveMeta = (payload: unknown) => {
  try { localStorage.setItem(KEY_META, JSON.stringify(payload)); } catch {}
};

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  challenges: [],
  isAdminAuthenticated: meta.isAdminAuthenticated === true,
  // 本地开发环境默认进入测试模式（避免需要后端API），生产环境默认正式模式
  envMode: import.meta.env.DEV ? 'test' : (meta.envMode === 'test' ? 'test' : 'production'),

  // —— 启动时拉取所有挑战（正式环境走后端，测试环境走本地 mockData）——
  init: async () => {
    if (get().envMode === 'test') {
      set({ challenges: mockChallenges });
      return;
    }
    try {
      const list = await http.get<Challenge[]>('/challenges');
      // json-server 返回的可能是空数组，也可能是 { data: [...] }；兼容两种
      const arr = Array.isArray(list) ? list : ((list as any)?.data ?? []);
      set({ challenges: arr });
    } catch (e) {
      console.error('Failed to load challenges:', e);
      set({ challenges: [] });
    }
  },

  authenticateAdmin: async (password) => {
    if (password !== ADMIN_PASSWORD) return false;
    // 测试环境：不走后端；正式环境：向后端确认
    if (get().envMode === 'production') {
      try {
        const r = await http.post<{ ok: boolean }>('/admin-login', { password });
        if (!r.ok) return false;
      } catch { return false; }
    }
    set({ isAdminAuthenticated: true });
    saveMeta({ envMode: get().envMode, isAdminAuthenticated: true });
    return true;
  },

  logoutAdmin: () => {
    set({ isAdminAuthenticated: false });
    saveMeta({ envMode: get().envMode, isAdminAuthenticated: false });
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
      createdAt: Date.now(),
    };
    if (mode === 'test') {
      set((s) => ({ challenges: [...s.challenges, newChallenge] }));
      return;
    }
    try {
      await http.post('/challenges', newChallenge);
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
      if (latest) await http.put(`/challenges/${challengeId}`, latest);
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
      if (latest) await http.put(`/challenges/${challengeId}`, latest);
    } catch (e) { console.error(e); }
  },

  joinChallenge: async (challengeId, participantName, stake, side) => {
    const challenge = get().challenges.find((c) => c.id === challengeId);
    if (!challenge) return false;
    if (challenge.isBlocked) return false;
    if (challenge.status !== 'active') return false;

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

    set((s) => ({
      challenges: s.challenges.map((c) =>
        c.id === challengeId ? { ...c, participants: [...c.participants, newParticipant] } : c
      ),
    }));

    if (get().envMode === 'test') return true;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      if (latest) await http.put(`/challenges/${challengeId}`, latest);
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
      if (latest) await http.put(`/challenges/${challengeId}`, latest);
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
      if (latest) await http.put(`/challenges/${challengeId}`, latest);
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
      if (latest) await http.put(`/challenges/${challengeId}`, latest);
    } catch (e) { console.error(e); }
  },

  deleteChallenge: async (challengeId) => {
    set((s) => ({
      challenges: s.challenges.filter((c) => c.id !== challengeId),
    }));
    if (get().envMode === 'test') return;
    try {
      await http.delete(`/challenges/${challengeId}`);
    } catch (e) { console.error(e); }
  },

  getChallengeById: (id) => get().challenges.find((c) => c.id === id),
}));
