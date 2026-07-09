import { create } from 'zustand';
import { Challenge, Participant, Essay, ParticipantItem } from '../types';
import { mockChallenges } from '../data/mockData';

export type EnvMode = 'test' | 'production';

// —— API 地址：开发时用 Vite dev server 反向代理，生产时走同域 /api ——
const API_BASE = '/api';

// —— Token 存储键 ——
const KEY_META = 'challenge-meta-v1';
const KEY_API_TOKEN = 'challenge-api-token';
const KEY_LOCAL_CHALLENGES = 'challenge-data-v1';
const KEY_LOCAL_ESSAYS = 'essay-data-v1';
const KEY_LOCAL_PARTICIPANTS = 'participant-data-v1';

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

const saveLocalChallenges = (challenges: Challenge[]) => {
  try {
    localStorage.setItem(KEY_LOCAL_CHALLENGES, JSON.stringify(challenges));
  } catch { /* ignore */ }
};

const loadLocalChallenges = (): Challenge[] => {
  try {
    const raw = localStorage.getItem(KEY_LOCAL_CHALLENGES);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
};

const saveLocalEssays = (essays: Essay[]) => {
  try {
    localStorage.setItem(KEY_LOCAL_ESSAYS, JSON.stringify(essays));
  } catch { /* ignore */ }
};

const loadLocalEssays = (): Essay[] => {
  try {
    const raw = localStorage.getItem(KEY_LOCAL_ESSAYS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
};

const saveLocalParticipants = (participants: ParticipantItem[]) => {
  try {
    localStorage.setItem(KEY_LOCAL_PARTICIPANTS, JSON.stringify(participants));
  } catch { /* ignore */ }
};

const loadLocalParticipants = (): ParticipantItem[] => {
  try {
    const raw = localStorage.getItem(KEY_LOCAL_PARTICIPANTS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
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
  participants: ParticipantItem[];
  isAdminAuthenticated: boolean;
  envMode: EnvMode;
  init: () => Promise<void>;
  authenticateAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  setEnvMode: (mode: EnvMode) => void;
  addChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'participants' | 'essays' | 'isBlocked' | 'status'>) => Promise<void>;
  updateChallenge: (challengeId: string, updates: Partial<Challenge>) => Promise<void>;
  toggleBlock: (challengeId: string) => Promise<void>;
  joinChallenge: (challengeId: string, participantId: string, participantName: string, stake: number, side: 'support' | 'oppose') => Promise<boolean>;
  setChallengeResult: (challengeId: string, hostResult: 'success' | 'failed') => Promise<void>;
  updateParticipant: (challengeId: string, participantId: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (challengeId: string, participantId: string) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;
  getChallengeById: (id: string) => Challenge | undefined;
  addEssay: (essay: Omit<Essay, 'id' | 'createdAt'>) => Promise<void>;
  deleteEssay: (essayId: string) => Promise<void>;
  loadParticipants: () => Promise<void>;
  addParticipantItem: (name: string, avatar?: string) => Promise<ParticipantItem | null>;
  updateParticipantItem: (id: string, updates: Partial<ParticipantItem>) => Promise<boolean>;
  deleteParticipantItem: (id: string) => Promise<boolean>;
  reorderParticipants: (orderedIds: string[]) => Promise<boolean>;
}

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  challenges: [],
  essays: [],
  participants: [],
  isAdminAuthenticated: meta.isAdminAuthenticated === true,
  // 本地开发环境默认进入测试模式（避免需要后端API），生产环境默认正式模式
  envMode: import.meta.env.DEV ? 'test' : (meta.envMode === 'test' ? 'test' : 'production'),

  // —— 启动时拉取所有挑战和小作文（正式环境走后端，测试环境走本地 localStorage/mockData）——
  init: async () => {
    if (get().envMode === 'test') {
      const savedChallenges = loadLocalChallenges();
      const savedEssays = loadLocalEssays();
      const savedParticipants = loadLocalParticipants();
      if (savedChallenges.length > 0) {
        set({ challenges: savedChallenges, essays: savedEssays, participants: savedParticipants });
      } else {
        const allEssays: Essay[] = mockChallenges.flatMap((c) => c.essays || []);
        set({ challenges: mockChallenges, essays: allEssays, participants: [] });
        saveLocalChallenges(mockChallenges);
        saveLocalEssays(allEssays);
        saveLocalParticipants([]);
      }
      return;
    }
    try {
      const list = await http.get<Challenge[]>('/challenges');
      const arr = Array.isArray(list) ? list : ([] as Challenge[]);
      const essayList = await http.get<Essay[]>('/essays').catch(() => [] as Essay[]);
      const essayArr = Array.isArray(essayList) ? essayList : ([] as Essay[]);
      const participantList = await http.get<ParticipantItem[]>('/participants').catch(() => [] as ParticipantItem[]);
      const participantArr = Array.isArray(participantList) ? participantList : ([] as ParticipantItem[]);
      set({ challenges: arr, essays: essayArr, participants: participantArr });
    } catch (e) {
      console.error('Failed to load data from server:', e);
      set({ challenges: [], essays: [], participants: [] });
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

  // —— 测试环境：localState 里变一下，同时持久化到 localStorage；正式环境：先调 API 成功后更新 state ——
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
      set((s) => {
        const updated = [...s.challenges, newChallenge];
        saveLocalChallenges(updated);
        return { challenges: updated };
      });
      return;
    }
    try {
      const token = loadToken();
      await http.post('/challenges', newChallenge, token);
      set((s) => ({ challenges: [...s.challenges, newChallenge] }));
    } catch (e) {
      console.error('Add challenge failed:', e);
    }
  },

  updateChallenge: async (challengeId, updates) => {
    const mode = get().envMode;
    set((s) => {
      const updated = s.challenges.map((c) => c.id === challengeId ? { ...c, ...updates } : c);
      if (mode === 'test') saveLocalChallenges(updated);
      return { challenges: updated };
    });
    if (mode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  toggleBlock: async (challengeId) => {
    const mode = get().envMode;
    set((s) => {
      const updated = s.challenges.map((c) => c.id === challengeId ? { ...c, isBlocked: !c.isBlocked } : c);
      if (mode === 'test') saveLocalChallenges(updated);
      return { challenges: updated };
    });
    if (mode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  joinChallenge: async (challengeId, participantId, participantName, stake, side) => {
    const challenge = get().challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      console.error('Join failed: challenge not found');
      return false;
    }
    if (challenge.isBlocked) {
      console.error('Join failed: challenge is blocked');
      return false;
    }
    if (challenge.status !== 'active') {
      console.error('Join failed: challenge status is not active, current:', challenge.status);
      return false;
    }

    const endOfDay = new Date(challenge.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (endOfDay.getTime() < Date.now()) {
      console.error('Join failed: challenge expired, endDate:', challenge.endDate);
      return false;
    }

    console.log('Join challenge conditions met, envMode:', get().envMode);

    const today = new Date();
    const joinDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const newParticipant: Participant = {
      id: `participant-${Date.now()}`,
      challengeId,
      participantId,
      participantName,
      stake,
      side,
      result: 'pending',
      createdAt: Date.now(),
      joinTime: joinDate,
    };

    if (get().envMode === 'test') {
      set((s) => {
        const updated = s.challenges.map((c) =>
          c.id === challengeId ? { ...c, participants: [...c.participants, newParticipant] } : c
        );
        saveLocalChallenges(updated);
        return { challenges: updated };
      });
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
      console.error('Join challenge failed:', e);
      return false;
    }
  },

  setChallengeResult: async (challengeId, hostResult) => {
    const mode = get().envMode;
    set((s) => {
      const updated = s.challenges.map((c) => {
        if (c.id !== challengeId) return c;
        const updatedParticipants = c.participants.map((p): Participant => ({
          ...p,
          result: hostResult === 'success'
            ? (p.side === 'support' ? 'win' : 'lose')
            : (p.side === 'support' ? 'lose' : 'win'),
        }));
        return { ...c, participants: updatedParticipants, status: 'completed' as const };
      });
      if (mode === 'test') saveLocalChallenges(updated);
      return { challenges: updated };
    });
    if (mode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  updateParticipant: async (challengeId, participantId, updates) => {
    const mode = get().envMode;
    set((s) => {
      const updated = s.challenges.map((c) =>
        c.id === challengeId
          ? { ...c, participants: c.participants.map((p) => p.id === participantId ? { ...p, ...updates } : p) }
          : c
      );
      if (mode === 'test') saveLocalChallenges(updated);
      return { challenges: updated };
    });
    if (mode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  deleteParticipant: async (challengeId, participantId) => {
    const mode = get().envMode;
    set((s) => {
      const updated = s.challenges.map((c) =>
        c.id === challengeId
          ? { ...c, participants: c.participants.filter((p) => p.id !== participantId) }
          : c
      );
      if (mode === 'test') saveLocalChallenges(updated);
      return { challenges: updated };
    });
    if (mode === 'test') return;
    try {
      const latest = get().challenges.find((c) => c.id === challengeId);
      const token = loadToken();
      if (latest) await http.put(`/challenges/${challengeId}`, latest, token);
    } catch (e) { console.error(e); }
  },

  deleteChallenge: async (challengeId) => {
    const mode = get().envMode;
    set((s) => {
      const updatedChallenges = s.challenges.filter((c) => c.id !== challengeId);
      const updatedEssays = s.essays.filter((e) => e.challengeId !== challengeId);
      if (mode === 'test') {
        saveLocalChallenges(updatedChallenges);
        saveLocalEssays(updatedEssays);
      }
      return { challenges: updatedChallenges, essays: updatedEssays };
    });
    if (mode === 'test') return;
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
    const mode = get().envMode;
    
    set((s) => {
      const updated = [...s.essays, newEssay];
      if (mode === 'test') saveLocalEssays(updated);
      return { essays: updated };
    });
    
    if (mode === 'test') return;
    try {
      await http.post('/essays', newEssay);
    } catch (e) {
      console.error('Add essay failed:', e);
    }
  },

  deleteEssay: async (essayId) => {
    const mode = get().envMode;
    
    set((s) => {
      const updated = s.essays.filter((e) => e.id !== essayId);
      if (mode === 'test') saveLocalEssays(updated);
      return { essays: updated };
    });
    
    if (mode === 'test') return;
    try {
      const token = loadToken();
      await http.delete(`/essays/${essayId}`, token);
    } catch (e) {
      console.error(e);
    }
  },

  loadParticipants: async () => {
    const mode = get().envMode;
    if (mode === 'test') {
      const saved = loadLocalParticipants();
      set({ participants: saved });
      return;
    }
    try {
      const list = await http.get<ParticipantItem[]>('/participants');
      const arr = Array.isArray(list) ? list : ([] as ParticipantItem[]);
      set({ participants: arr });
    } catch (e) {
      console.error('Load participants failed:', e);
    }
  },

  addParticipantItem: async (name, avatar) => {
    const mode = get().envMode;
    const now = Date.now();
    const newItem: ParticipantItem = {
      id: `participant-${now}`,
      name,
      avatar,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    if (mode === 'test') {
      set((s) => {
        const updated = [...s.participants, newItem];
        saveLocalParticipants(updated);
        return { participants: updated };
      });
      return newItem;
    }

    try {
      const token = loadToken();
      const result = await http.post<ParticipantItem>('/participants', { name, avatar }, token);
      const item: ParticipantItem = result || newItem;
      // 后端未返回 id 时使用本地生成的 id
      if (!item.id) item.id = newItem.id;
      set((s) => ({ participants: [...s.participants, item] }));
      return item;
    } catch (e) {
      console.error('Add participant failed:', e);
      return null;
    }
  },

  updateParticipantItem: async (id, updates) => {
    const mode = get().envMode;
    
    set((s) => {
      const updated = s.participants.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      );
      if (mode === 'test') saveLocalParticipants(updated);
      return { participants: updated };
    });

    if (mode === 'test') return true;

    try {
      const token = loadToken();
      await http.put(`/participants/${id}`, updates, token);
      return true;
    } catch (e) {
      console.error('Update participant failed:', e);
      return false;
    }
  },

  deleteParticipantItem: async (id) => {
    const mode = get().envMode;
    
    set((s) => {
      const updatedParticipants = s.participants.filter((p) => p.id !== id);
      const updatedChallenges = s.challenges.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p.participantId === id ? { ...p, deleted: true } : p
        ),
      }));
      if (mode === 'test') {
        saveLocalParticipants(updatedParticipants);
        saveLocalChallenges(updatedChallenges);
      }
      return { participants: updatedParticipants, challenges: updatedChallenges };
    });

    if (mode === 'test') return true;

    try {
      const token = loadToken();
      await http.delete(`/participants/${id}`, token);
      return true;
    } catch (e) {
      console.error('Delete participant failed:', e);
      return false;
    }
  },

  reorderParticipants: async (orderedIds) => {
    const mode = get().envMode;
    const now = Date.now();

    // 先按顺序排，再为每个分配 order
    set((s) => {
      const byId = new Map(s.participants.map((p) => [p.id, p]));
      const ordered: ParticipantItem[] = [];
      orderedIds.forEach((id, idx) => {
        const item = byId.get(id);
        if (item) {
          ordered.push({ ...item, order: idx, updatedAt: now });
          byId.delete(id);
        }
      });
      // 未在 orderedIds 中的项追加在末尾
      byId.forEach((item) => ordered.push({ ...item, order: ordered.length, updatedAt: now }));
      if (mode === 'test') saveLocalParticipants(ordered);
      return { participants: ordered };
    });

    if (mode === 'test') return true;

    try {
      const token = loadToken();
      const latest = get().participants;
      // 逐项 PUT（也可改成 PATCH 批量接口）
      await Promise.all(
        latest.map((p) => http.put(`/participants/${p.id}`, { order: p.order }, token).catch(() => undefined))
      );
      return true;
    } catch (e) {
      console.error('Reorder participants failed:', e);
      return false;
    }
  },
}));
