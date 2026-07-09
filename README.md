# 壹拳俱乐部 - 群健康挑战赛

一个基于 React + TypeScript + Vite 的健康挑战管理平台，支持挑战发起、参与、对赌结算、动态小作文、自动备份等功能。

## 功能特性

### 核心功能
- 🎯 创建和管理健康挑战
- 👥 用户参与挑战（支持/反对/通赔）
- 🏆 挑战结果确认与奖金分配
- 📝 小作文模块（挑战动态、发布观点、点赞/踩）
- 🖼️ 图片上传、自动压缩、缩略图懒加载、全屏预览
- 💾 数据自动备份与恢复（服务器端 + 客户端）

### 管理功能
- 🔐 管理员面板（编辑、封档、删除挑战）
- 📊 进度条显示挑战剩余时间
- 🌐 测试环境与正式环境切换
- 🔒 API Token 保护数据修改接口
- 🗂️ 服务器备份文件管理（查看、下载、恢复、删除）

## 技术栈

- **前端**: React 18 + TypeScript + Vite 6
- **样式**: Tailwind CSS 3
- **状态管理**: Zustand
- **路由**: React Router DOM
- **图标**: Lucide React
- **后端**: Express + JSON 文件存储 + Multer + Sharp
- **图片处理**: Sharp（自动压缩）
- **部署**: Docker / Docker Compose

## 快速开始

### 本地开发

```bash
# 安装前端依赖
npm install

# 启动开发服务器（默认端口 5173）
npm run dev

# 启动后端（端口 3000）
cd deploy/backend
npm install
node server.js
```

### 构建生产版本

```bash
# 构建前端
npm run build

# 构建 Docker 镜像
./deploy/build.sh
```

### Docker 部署

```bash
# 设置环境变量（生产环境必须修改）
export ADMIN_PASSWORD=your_secure_password
export API_TOKEN=your_api_token

# 一键构建并启动
./deploy/build.sh

# 或使用 docker-compose
docker-compose up -d
```

## 项目结构

```
├── src/
│   ├── components/
│   │   ├── challenge/      # 挑战相关组件（ChallengeCard）
│   │   ├── essay/          # 小作文相关组件（EssayDetailModal）
│   │   ├── common/         # 通用组件（ImagePreviewModal 等）
│   │   └── ...
│   ├── pages/             # 页面（HomePage、ChallengeDetailPage 等）
│   ├── store/             # Zustand 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数（formatTime 等）
│   └── data/              # 模拟数据
├── deploy/
│   ├── backend/           # 后端服务（Express + Sharp）
│   │   ├── server.js      # 主服务
│   │   ├── package.json
│   │   └── Dockerfile
│   └── build.sh           # 一键构建脚本
├── public/                # 静态资源
├── Dockerfile             # 前端构建 + 后端统一镜像
└── docker-compose.yml     # 容器编排
```

## 数据存储结构

```
data/
├── db.json                    # 挑战 + 小作文数据
├── uploads/                   # 封面图存储
├── essay-uploads/             # 小作文图片（按挑战ID分组）
│   ├── mock-1/                # 挑战 ID 作为子目录
│   ├── mock-2/
│   └── ...
├── backups/                   # 服务器端自动备份
│   ├── backup-auto-*.json     # 自动备份（每天凌晨2点）
│   └── backup-manual-*.json   # 手动备份
├── .token                     # 自定义 API Token
└── .password                  # 自定义管理员密码
```

## 环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `ADMIN_PASSWORD` | 管理员密码 | 否 | `159357` |
| `API_TOKEN` | API 访问令牌（保护数据接口） | 否 | `fitness-api-secret-token-2024` |
| `PORT` | 服务端口 | 否 | `3000` |
| `DATA_DIR` | 数据存储目录 | 否 | `./data` |

## API 接口

### 公开接口（无需 Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/challenges` | 获取所有挑战（含小作文） |
| GET | `/api/essays` | 获取所有小作文 |
| GET | `/api/challenges/:id/essays` | 获取指定挑战的小作文 |
| GET | `/api/health` | 健康检查 |
| POST | `/api/essays` | 创建小作文（任何人可发布） |
| POST | `/api/upload` | 上传图片（自动压缩） |
| POST | `/api/admin-login` | 管理员登录 |
| POST | `/api/get-token` | 获取 API Token |

### 受保护接口（需 `X-Api-Token` 头）

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

## 小作文模块

### 核心功能
- 挑战卡片底部显示最新一条小作文（缩略图+标签+正文）
- 点击小作文区域弹出独立详情弹窗
- 支持发布文字+图片+观点（利多/利空）
- 支持图片上传（自动按挑战 ID 分目录存储）
- 上传图片自动压缩（最大 1920px，JPEG 85% 质量）
- 图片点击全屏预览
- 任何人可发布，管理员可删除

### 观点标签颜色
- **利多**（看好）：红色 🔴
- **利空**（看空）：绿色 🟢

## 安全机制

### 默认凭据

⚠️ **生产环境请务必修改默认凭据！**

| 项目 | 默认值 |
|------|--------|
| 管理员密码 | `159357` |
| API Token | `fitness-api-secret-token-2024` |
| 测试环境密码 | `admin123` |

### 在线修改密码/Token

登录后可在 **管理面板 → 安全设置** 中修改：
- 修改管理员密码（需重启服务以永久生效）
- 修改 API Token（修改后需重新登录）

### 环境隔离
- **测试环境**：使用本地 mock 数据，不连接后端
- **正式环境**：使用后端 API 持久化数据

## 备份与恢复

### 自动备份
- 服务器启动时立即创建一次备份
- 每天凌晨 2 点自动创建新备份
- 自动清理 7 天前的自动备份（手动备份不会被清理）

### 管理操作
- 在 **管理面板** 中可查看所有备份文件
- 支持下载、恢复、删除备份
- 备份文件包含完整的 `challenges` + `essays` 数据

## 性能优化

- ✅ 图片懒加载（`loading="lazy"` + `decoding="async"`）
- ✅ 上传图片自动压缩（Sharp）
- ✅ 缩略图按需加载，全屏预览按需显示
- ✅ Vite 构建优化（代码分割、gzip）

## License

MIT
