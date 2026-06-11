# 健康星球 - 技术架构文档

## 1. 技术栈总览

| 类别 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React@18 | 函数式组件 + Hooks |
| 语言 | TypeScript | 类型安全 |
| 构建工具 | Vite 6 | 快速开发构建 |
| 样式 | Tailwind CSS 3 | 原子化 CSS |
| 图标 | Lucide React | 轻量级 SVG 图标库 |
| 路由 | React Router DOM | SPA 路由管理 |
| 状态管理 | Zustand | 轻量级 store（极简 API） |
| 后端框架 | Express | RESTful API 服务 |
| 图片处理 | Sharp | 自动压缩图片 |
| 文件上传 | Multer | multipart/form-data 处理 |
| 数据存储 | JSON 文件数据库 | 后端文件系统存储 |
| 部署 | Docker / Docker Compose | 容器化部署 |
| 环境模拟 | 双模式切换（test/production） | 测试用 mockData.ts，正式用后端 API |

```
React@18 + TypeScript + Vite
├── 路由: React Router DOM (5 个页面)
├── 状态: Zustand (challengeStore.ts)
├── 样式: Tailwind CSS (深色运动科技风)
├── 后端: Express + JSON 文件数据库
├── 图片: Sharp 自动压缩 + Multer 上传
└── 部署: Docker / Docker Compose
```

## 2. 项目目录结构

```
Fitness website/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx              # 顶部导航（Logo + 登录状态 + 环境切换）
│   │   ├── challenge/
│   │   │   └── ChallengeCard.tsx       # 挑战卡片（首页列表复用，含小作文模块）
│   │   ├── essay/
│   │   │   └── EssayDetailModal.tsx    # 小作文详情弹窗 + 发布弹窗
│   │   └── common/
│   │       └── ImagePreviewModal.tsx   # 图片全屏预览组件
│   ├── pages/
│   │   ├── HomePage.tsx                # 首页 - 搜索/筛选/卡片分组展示
│   │   ├── ChallengeDetailPage.tsx     # 详情页 - 参与/列表/资金池统计/结算
│   │   ├── CreateChallengePage.tsx     # 创建页 - 表单 + 图片上传/URL
│   │   ├── AdminLoginPage.tsx          # 管理员登录页 - 密码校验
│   │   └── AdminPanelPage.tsx          # 管理面板 - 全量编辑/封档/结算/备份
│   ├── store/
│   │   └── challengeStore.ts           # Zustand store（核心业务逻辑 + API调用）
│   ├── types/
│   │   └── index.ts                    # TypeScript 类型定义（Challenge/Participant/Essay）
│   ├── utils/
│   │   └── format.ts                   # 工具函数（formatTime 等）
│   ├── data/
│   │   └── mockData.ts                 # 7 条示例挑战（含多种状态与小作文）
│   ├── App.tsx                         # 路由定义
│   ├── main.tsx                        # 应用入口
│   └── index.css                       # 全局样式 + 自定义滚动条 + fade-in 动画
├── deploy/
│   ├── backend/
│   │   ├── server.js                   # Express 后端服务
│   │   ├── package.json
│   │   └── Dockerfile
│   └── build.sh                        # 一键构建脚本
├── public/                             # 静态资源
├── .trae/documents/
│   ├── PRD.md                          # 产品需求文档
│   └── Technical-Architecture.md       # 本文档
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── Dockerfile                          # 前端构建 + 后端统一镜像
└── docker-compose.yml                  # 容器编排
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
  essays: Essay[];               // 小作文列表
  isAdminAuthenticated: boolean;  // 管理员登录状态
  envMode: EnvMode;               // 'test' | 'production'

  // 初始化
  init: () => Promise<void>;

  // 管理员
  authenticateAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;

  // 环境切换
  setEnvMode: (mode: EnvMode) => void;

  // 挑战 CRUD
  addChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'participants' | 'essays' | 'isBlocked' | 'status'>) => Promise<void>;
  updateChallenge: (challengeId: string, updates: Partial<Challenge>) => Promise<void>;
  toggleBlock: (challengeId: string) => Promise<void>;
  setChallengeResult: (challengeId: string, hostResult: 'success' | 'failed') => Promise<void>;
  updateParticipant: (challengeId: string, participantId: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (challengeId: string, participantId: string) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;

  // 参与
  joinChallenge: (challengeId: string, participantName: string, stake: number, side: 'support' | 'oppose') => Promise<boolean>;

  // 小作文
  addEssay: (essay: Omit<Essay, 'id' | 'createdAt'>) => Promise<void>;
  deleteEssay: (essayId: string) => Promise<void>;

  // 查询
  getChallengeById: (id: string) => Challenge | undefined;
}
```

### 4.2 初始化逻辑

```typescript
// 测试环境：从 mockData.ts 加载挑战和小作文
if (get().envMode === 'test') {
  const allEssays = mockChallenges.flatMap(c => c.essays || []);
  set({ challenges: mockChallenges, essays: allEssays });
  return;
}

// 正式环境：同时调用挑战和小作文 API
const challenges = await http.get<Challenge[]>('/challenges');
const essays = await http.get<Essay[]>('/essays');
set({ challenges, essays });
```

### 4.3 持久化策略

**测试环境**：不持久化，刷新后重新从 mockData.ts 生成

**正式环境**：所有写操作调用后端 API 持久化

```typescript
// 挑战创建
await http.post('/challenges', newChallenge);

// 小作文创建
await http.post('/essays', newEssay);

// 删除小作文（需 Token）
await http.delete(`/essays/${essayId}`, token);
```

## 5. 后端 API 设计

### 5.1 公开接口（无需 Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/challenges` | 获取所有挑战（含小作文） |
| GET | `/api/essays` | 获取所有小作文 |
| GET | `/api/challenges/:id/essays` | 获取指定挑战的小作文 |
| GET | `/api/health` | 健康检查 |
| POST | `/api/essays` | 创建小作文 |
| POST | `/api/upload` | 上传图片（公开，自动压缩） |
| POST | `/api/admin-login` | 管理员登录 |
| POST | `/api/get-token` | 获取 API Token |

### 5.2 受保护接口（需 `X-Api-Token` 头）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin-upload` | 管理员上传图片 |
| POST | `/api/challenges` | 创建挑战 |
| PUT | `/api/challenges/:id` | 更新挑战 |
| DELETE | `/api/challenges/:id` | 删除挑战 |
| DELETE | `/api/essays/:id` | 删除小作文 |
| POST | `/api/change-password` | 修改管理员密码 |
| POST | `/api/change-token` | 修改 API Token |
| POST | `/api/backup` | 创建手动备份 |
| GET | `/api/server-backups` | 获取服务器备份列表 |
| POST | `/api/server-restore/:filename` | 从服务器备份恢复 |
| DELETE | `/api/server-backup/:filename` | 删除服务器备份 |
| GET | `/api/backup/download/:filename` | 下载备份文件 |

## 6. 数据存储结构

```
data/
├── db.json                    # 挑战 + 小作文数据
│   ├── challenges: []         # 挑战列表
│   └── essays: []             # 小作文列表
├── uploads/                   # 封面图存储
├── essay-uploads/             # 小作文图片（按挑战ID分组）
│   ├── mock-1/               # 挑战 ID 作为子目录
│   │   ├── 1700000001-xxx.jpg
│   │   └── 1700000002-yyy.jpg
│   └── mock-2/
│       └── ...
├── backups/                   # 服务器端备份
│   ├── backup-auto-2024-01-15T02-00-00.json   # 自动备份
│   └── backup-manual-2024-01-15T10-30-00.json # 手动备份
├── .token                     # 自定义 API Token
└── .password                  # 自定义管理员密码
```

## 7. 图片处理流程

### 7.1 小作文图片上传

```
前端上传
  ↓
POST /api/upload (multipart/form-data)
  ↓
Multer 接收文件
  ↓
Sharp 压缩（最大 1920px，JPEG 85% 质量）
  ↓
按 challengeId 分目录存储
  ↓
返回 /essay-uploads/{challengeId}/{filename}
```

### 7.2 图片压缩配置

```javascript
async function compressImage(inputBuffer, maxWidth = 1920, quality = 85) {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  // 小于最大宽度，直接返回
  if (metadata.width <= maxWidth) {
    return image.toBuffer();
  }

  // 调整大小并压缩
  return await image
    .resize(maxWidth, null, { withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .png({ compressionLevel: 9 })
    .webp({ quality })
    .toBuffer();
}
```

## 8. 核心业务逻辑

### 8.1 有效状态计算

```typescript
type EffectiveStatus = 'active' | 'pending' | 'completed';

function getEffectiveStatus(challenge: Challenge): EffectiveStatus {
  if (challenge.status === 'completed') return 'completed';
  const endDate = new Date(challenge.endDate).getTime();
  if (challenge.status === 'active' && Date.now() > endDate) return 'pending';
  return 'active';
}
```

### 8.2 参与挑战的校验规则

```typescript
joinChallenge(challengeId, name, stake, side) {
  // 1. 挑战存在
  // 2. 未封档 !isBlocked
  // 3. 状态为 active（未过期，未完成）
  // 不满足则返回 false
}
```

### 8.3 结算逻辑

```typescript
setChallengeResult(challengeId, hostResult) {
  // 遍历 participants，按规则更新 result:
  //   hostResult === 'success' → support=win, oppose=lose
  //   hostResult === 'failed'  → support=lose, oppose=win
  // challenge.status 更新为 'completed'
}
```

### 8.4 资金池统计

```
挑战者资金  = 所有 support 方 stake 之和
参与者资金  = 所有 oppose 方 stake 之和
赢家/输家  = 按 hostResult 动态判断
赢家奖金   = 赢家按押注比例分配 (输家押金 + 发起人付出)
发起人付出 = max(底仓金额, min(赢家押注 - 输家押金, 通赔金额)) （仅失败时）
总奖池    = 输家押金 + 发起人付出
```

## 9. 数据流图

### 9.1 测试环境

```
页面加载
  ↓
init() → 检测 envMode === 'test'
  ↓
从 mockData.ts 加载 challenges 和 essays
  ↓
Zustand Store 状态更新
  ↓
UI 渲染（无网络请求）
```

### 9.2 正式环境

```
页面加载
  ↓
init() → 检测 envMode === 'production'
  ↓
GET /api/challenges + GET /api/essays
  ↓
Zustand Store 状态更新
  ↓
UI 渲染
```

### 9.3 用户操作（正式环境）

```
用户操作 (UI)
  ↓
Zustand Store action (addEssay / deleteEssay / ...)
  ↓
内部状态更新 + API 调用
  ↓
后端数据库持久化
  ↓
UI 响应式更新
```

## 10. 类型安全

### 10.1 Challenge 类型

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
  minStake: number;            // 底仓金额
  status: 'active' | 'pending' | 'completed';
  isBlocked: boolean;
  participants: Participant[];
  essays: Essay[];             // 前端使用
  createdAt: number;
}
```

### 10.2 Participant 类型

```typescript
interface Participant {
  id: string;
  challengeId: string;
  participantName: string;
  stake: number;
  side: 'support' | 'oppose';
  result: 'win' | 'lose' | 'pending';
  createdAt: number;
}
```

### 10.3 Essay 类型（小作文）

```typescript
interface Essay {
  id: string;
  challengeId: string;
  content: string;
  imageUrl?: string;           // 可选图片
  sentiment: 'bullish' | 'bearish';  // 利多 / 利空
  createdAt: number;
}
```

### 10.4 环境模式类型

```typescript
export type EnvMode = 'test' | 'production';
```

## 11. UI 组件体系

### 11.1 设计令牌（Tailwind 语义色）

| 角色 | 色值 | 用法 |
|------|------|------|
| 主背景 | neutral-950 | body、页面背景 |
| 卡片背景 | neutral-900 | 挑战卡片、表单容器 |
| 强调色 | orange-500 / orange-600 | Logo 渐变、主按钮、链接 |
| 进行中 | green-500 实心 | 状态标签 |
| 待确认 | yellow-500 实心 | 状态标签 |
| 已结束 | neutral-600 实心 | 状态标签 |
| 封档 | red-500/10 半透明 + red-500/20 边框 | 封档标签 |
| 利多 | red-500/10 半透明 + red-400 文字 | 小作文观点标签 |
| 利空 | green-500/10 半透明 + green-400 文字 | 小作文观点标签 |
| 文字主色 | white | 标题、重点 |
| 文字次色 | neutral-400/500 | 副标题、辅助信息 |
| 边框 | neutral-800 | 卡片边框、输入框边框 |

### 11.2 组件间关系

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
     │    └── ChallengeCard[]（按状态分组）
     │         └── 小作文模块（最新1条）
     │
     ├── ChallengeDetailPage
     │    ├── 基础信息区
     │    ├── 资金池统计
     │    ├── 参与表单
     │    ├── 参与者列表
     │    ├── 结算信息
     │    └── 管理员操作
     │
     ├── EssayDetailModal (弹出层)
     │    ├── 小作文列表
     │    ├── 添加按钮 → AddEssayModal
     │    └── 图片预览 → ImagePreviewModal
     │
     ├── CreateChallengePage
     │    └── 表单
     │
     ├── AdminLoginPage
     │    └── 密码表单
     │
     └── AdminPanelPage
          ├── Challenge[] 可编辑卡片
          │    ├── 挑战信息编辑
          │    ├── 参与者编辑
          │    └── 封档/结算操作
          └── 备份管理
```

## 12. 构建与开发

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器（端口 5173） |
| `npm run build` | 生产构建 + TypeScript 类型检查 |
| `npm run preview` | 预览构建产物 |
| `node server.js` | 启动后端服务（端口 3000） |
| `./deploy/build.sh` | Docker 一键构建 |

## 13. 备份策略

### 13.1 自动备份

- 服务器启动时立即创建一次备份
- 每天凌晨 2 点自动创建新备份
- 自动清理 7 天前的自动备份

### 13.2 手动备份

- 管理员可在管理面板手动创建备份
- 手动备份不会被自动清理

### 13.3 备份内容

```json
{
  "data": {
    "challenges": [...],
    "essays": [...]
  },
  "timestamp": "2024-01-15T02:00:00.000Z",
  "version": "1.0",
  "type": "auto" | "manual"
}
```

## 14. 性能优化

- ✅ 图片懒加载（`loading="lazy"` + `decoding="async"`）
- ✅ 上传图片自动压缩（Sharp，最大 1920px，JPEG 85% 质量）
- ✅ 缩略图按需加载，全屏预览按需显示
- ✅ Vite 构建优化（代码分割、gzip）
- ✅ 小作文图片按挑战 ID 分目录存储，便于管理

## 15. 环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `ADMIN_PASSWORD` | 管理员密码 | 否 | `159357` |
| `API_TOKEN` | API 访问令牌 | 否 | `fitness-api-secret-token-2024` |
| `PORT` | 服务端口 | 否 | `3000` |
| `DATA_DIR` | 数据存储目录 | 否 | `./data` |

## 16. 已知约束

- **密码明文**：管理员密码明文存储在配置文件中，仅供简单场景使用
- **无用户系统**：参与者以姓名纯文本区分，没有账户和身份验证
- **无跨设备同步**：测试环境数据不共享，正式环境数据存储在服务器本地

若需更高级功能，推荐接入：
- 数据库：PostgreSQL / MySQL（替换 JSON 文件存储）
- 用户系统：JWT 认证 + 用户表
- 对象存储：S3 / OSS（替换本地文件系统存储图片）
