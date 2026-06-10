# 健康星球 - 技术架构文档

## 1. 技术栈总览

| 类别 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React@18 | 函数式组件 + Hooks |
| 语言 | TypeScript | 类型安全 |
| 构建工具 | Vite | 快速开发构建 |
| 样式 | Tailwind CSS | 原子化 CSS |
| 图标 | Lucide React | 轻量级 SVG 图标库 |
| 路由 | React Router DOM | SPA 路由管理 |
| 状态管理 | Zustand | 轻量级 store（极简 API） |
| 数据持久化 | LocalStorage | 手动读写，双 key 隔离 |
| 环境模拟 | 双模式切换（test/production） | 测试用 mockData.ts，正式用 localStorage |

```
React@18 + TypeScript + Vite
├── 路由: React Router DOM (5 个页面)
├── 状态: Zustand (challengeStore.ts)
├── 样式: Tailwind CSS (深色运动科技风)
└── 持久化: LocalStorage (双 key 隔离)
```

## 2. 项目目录结构

```
Fitness website/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx              # 顶部导航（Logo + 登录状态 + 环境切换）
│   │   └── challenge/
│   │       └── ChallengeCard.tsx       # 挑战卡片（首页列表复用）
│   ├── pages/
│   │   ├── HomePage.tsx                # 首页 - 搜索/筛选/卡片分组展示
│   │   ├── ChallengeDetailPage.tsx     # 详情页 - 参与/列表/资金池统计/结算
│   │   ├── CreateChallengePage.tsx     # 创建页 - 表单 + 图片上传/URL
│   │   ├── AdminLoginPage.tsx          # 管理员登录页 - 密码校验
│   │   └── AdminPanelPage.tsx          # 管理面板 - 全量编辑/封档/结算
│   ├── store/
│   │   └── challengeStore.ts           # Zustand store（核心业务逻辑）
│   ├── types/
│   │   └── index.ts                    # TypeScript 类型定义（Challenge/Participant/ADMIN_PASSWORD）
│   ├── data/
│   │   └── mockData.ts                 # 10 条示例挑战（含多种状态与场景）
│   ├── App.tsx                         # 路由定义
│   ├── main.tsx                        # 应用入口
│   └── index.css                       # 全局样式 + 自定义滚动条 + fade-in 动画
├── .trae/documents/
│   ├── PRD.md                          # 产品需求文档
│   └── Technical-Architecture.md       # 本文档
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 3. 路由定义

| 路由 | 页面组件 | 说明 |
|------|---------|------|
| `/` | HomePage | 首页，展示挑战卡片（按状态分组或平铺） |
| `/challenge/:id` | ChallengeDetailPage | 挑战详情与参与入口 |
| `/create` | CreateChallengePage | 仅管理员可访问，创建新挑战 |
| `/admin-login` | AdminLoginPage | 管理员密码登录页 |
| `/admin` | AdminPanelPage | 仅管理员可访问，全量管理面板 |

## 4. 状态管理（Zustand Store）

### 4.1 Store 接口

```typescript
interface ChallengeStore {
  // 数据
  challenges: Challenge[];         // 当前环境下的挑战列表
  isAdminAuthenticated: boolean;   // 管理员登录状态
  envMode: EnvMode;                // 'test' | 'production'

  // 管理员
  authenticateAdmin: (password: string) => boolean;
  logoutAdmin: () => void;

  // 环境切换
  setEnvMode: (mode: EnvMode) => void;

  // CRUD
  addChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'participants' | 'isBlocked' | 'status'>) => void;
  updateChallenge: (challengeId: string, updates: Partial<Challenge>) => void;
  toggleBlock: (challengeId: string) => void;
  setChallengeResult: (challengeId: string, hostResult: 'success' | 'failed') => void;
  updateParticipant: (challengeId: string, participantId: string, updates: Partial<Participant>) => void;

  // 参与
  joinChallenge: (challengeId: string, participantName: string, stake: number, side: 'support' | 'oppose') => boolean;

  // 查询
  getChallengeById: (id: string) => Challenge | undefined;
}
```

### 4.2 初始化逻辑

```typescript
// 从 localStorage 读取元信息
const meta = safeGet<{ envMode?: EnvMode; isAdminAuthenticated?: boolean }>('challenge-meta-v1', {});

// 测试环境 → mockChallenges；正式环境 → 从 challenge-production-v1 读取
const getInitialChallenges = (mode: EnvMode): Challenge[] => {
  return mode === 'test' ? mockChallenges : safeGet<Challenge[]>('challenge-production-v1', []);
};
```

### 4.3 持久化策略（核心）

**原则**：测试环境不持久化，正式环境所有写操作立即持久化。

```typescript
const persistIfProduction = (mode: EnvMode, challenges: Challenge[]) => {
  if (mode === 'production') {
    safeSet('challenge-production-v1', challenges);  // 只写挑战数据
  }
};

// 元信息（登录状态、环境模式）始终持久化
safeSet('challenge-meta-v1', { envMode, isAdminAuthenticated });
```

**三个独立的 localStorage key**：

| Key | 内容 | 写入时机 |
|-----|------|---------|
| `challenge-meta-v1` | `{ envMode, isAdminAuthenticated }` | 切换环境/登录/登出时 |
| `challenge-production-v1` | 正式环境 Challenge[] | 仅 production 模式下任何 CRUD 后 |
| —（无 key） — | 测试环境数据 | 不写入 localStorage，刷新后重新从 mockData.ts 生成 |

## 5. 核心业务逻辑

### 5.1 有效状态计算（首页/管理面板共用）

```typescript
type EffectiveStatus = 'active' | 'pending' | 'completed';

function getEffectiveStatus(challenge: Challenge): EffectiveStatus {
  if (challenge.status === 'completed') return 'completed';
  const endDate = new Date(challenge.endDate).getTime();
  // active 且已过期 → 待确认；否则 → 进行中
  if (challenge.status === 'active' && Date.now() > endDate) return 'pending';
  return 'active';
}
```

### 5.2 参与挑战的校验规则

```typescript
joinChallenge(challengeId, name, stake, side) {
  // 1. 挑战存在
  // 2. 未封档 !isBlocked
  // 3. 状态为 active（未过期，未完成）
  // 不满足则返回 false
}
```

### 5.3 结算逻辑

```typescript
setChallengeResult(challengeId, hostResult) {
  // 遍历 participants，按规则更新 result:
  //   hostResult === 'success' → support=win, oppose=lose
  //   hostResult === 'failed'  → support=lose, oppose=win
  // challenge.status 更新为 'completed'
}
```

### 5.4 资金池统计（详情页实时计算）

```
挑战者资金  = 所有 support 方 stake 之和
参与者资金  = 所有 oppose 方 stake 之和
赢家/输家  = 按 hostResult 动态判断
赢家奖金   = 赢家按押注比例分配 (输家押金 + 发起人付出)
发起人付出 = max(底仓金额, min(赢家押注 - 输家押金, 通赔金额)) （仅失败时）
总奖池    = 输家押金 + 发起人付出
```

## 6. 数据流图

```
用户操作 (UI)
    ↓
Zustand Store action (addChallenge / joinChallenge / ...)
    ↓
内部状态更新
    ↓
生产环境? ──否→ 结束（仅刷新 UI）
    │是
    ↓
localStorage.setItem('challenge-production-v1', JSON.stringify(challenges))
    ↓
下次刷新 → getInitialChallenges('production') → 恢复数据
```

```
管理员切换环境
    ↓
setEnvMode('test' | 'production')
    ↓
envMode 更新 → 重新从对应数据源加载 challenges
    ↓
localStorage.setItem('challenge-meta-v1', ...) → 记住选择
```

## 7. 类型安全

### 7.1 Challenge 类型

```typescript
interface Challenge {
  id: string;
  theme: string;
  goal: string;
  hostName: string;
  coverImage: string;
  startDate: string;            // YYYY-MM-DD
  endDate: string;              // YYYY-MM-DD
  maxPayout: number;            // 通赔金额
  minStake: number;             // 底仓金额
  status: 'active' | 'pending' | 'completed';
  isBlocked: boolean;
  participants: Participant[];
  createdAt: number;
}

interface Participant {
  id: string;
  challengeId: string;
  participantName: string;
  stake: number;
  side: 'support' | 'oppose';
  result: 'win' | 'lose' | 'pending';
  createdAt: number;
}

export const ADMIN_PASSWORD = '159357';  // 管理员登录密码
export type ChallengeStatus = 'all' | 'active' | 'pending' | 'completed';  // 筛选器用
```

### 7.2 环境模式类型

```typescript
export type EnvMode = 'test' | 'production';
```

## 8. UI 组件体系

### 8.1 设计令牌（Tailwind 语义色）

| 角色 | 色值 | 用法 |
|------|------|------|
| 主背景 | neutral-950 | body、页面背景 |
| 卡片背景 | neutral-900 | 挑战卡片、表单容器 |
| 强调色 | orange-500 / orange-600 | Logo 渐变、主按钮、链接 |
| 进行中 | green-500 实心 | 状态标签 |
| 待确认 | yellow-500 实心 | 状态标签 |
| 已结束 | neutral-600 实心 | 状态标签 |
| 封档 | red-500/10 半透明 + red-500/20 边框 | 封档标签 |
| 文字主色 | white | 标题、重点 |
| 文字次色 | neutral-400/500 | 副标题、辅助信息 |
| 边框 | neutral-800 | 卡片边框、输入框边框 |

### 8.2 组件间关系

```
App (Router)
└── Header (常驻顶部)
     ├── Logo + "健康星球"
     └── 管理员登录后：
         ├── 环境切换（测试/正式）
         ├── 创建挑战按钮
         ├── 管理面板按钮
         └── 退出按钮
└── Routes
     ├── HomePage
     │    ├── 搜索/筛选
     │    └── ChallengeCard[]（按状态分组或平铺）
     │
     ├── ChallengeDetailPage
     │    ├── 基础信息区
     │    ├── 资金池统计（纯计算展示）
     │    ├── 参与表单（条件渲染）
     │    ├── 参与者列表
     │    ├── 结算信息（completed 时展示）
     │    └── 管理员操作（登录后展示）
     │
     ├── CreateChallengePage
     │    └── 表单（封面/主题/目标/发起人/时间/筹码）
     │
     ├── AdminLoginPage
     │    └── 密码表单
     │
     └── AdminPanelPage
          └── Challenge[] 可编辑卡片
               ├── 挑战信息编辑
               ├── 参与者编辑
               └── 封档/结算操作
```

## 9. 构建与开发

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（Vite） |
| `npm run build` | 生产构建 + TypeScript 类型检查 |
| `npm run preview` | 预览构建产物 |

## 10. 数据迁移策略

- 每次挑战数据结构变动时，**变更 localStorage key 的版本后缀**（如 `-v1` → `-v2`），强制丢弃旧数据重新初始化
- 测试环境数据直接来自 mockData.ts，修改源文件即可，无需迁移

## 11. 已知约束

- **无后端**：所有数据仅保存在浏览器 localStorage，清除浏览器数据会导致永久丢失
- **无用户系统**：参与者以姓名纯文本区分，没有账户和身份验证
- **密码明文**：管理员密码硬编码在 `types/index.ts` 中，仅供简单场景使用
- **无跨设备同步**：数据不共享，不同浏览器/设备看到的正式环境数据不同

若需后端支持，推荐接入 Firebase Firestore 或 Supabase（可直接替换 `challengeStore.ts` 的持久化层，UI 无需改动）。
