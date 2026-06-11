# 健康星球 - 群健康挑战赛

一个基于 React + TypeScript + Vite 的健康挑战管理平台。

## 功能特性

- 🎯 创建和管理健康挑战
- 👥 用户参与挑战（支持/反对）
- 🏆 挑战结果确认与奖金分配
- 🔐 管理员面板（编辑、封档、删除挑战）
- 📊 进度条显示挑战剩余时间
- 🌐 测试环境与正式环境切换
- 🔒 API Token 保护数据修改接口

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS 3
- **状态管理**: Zustand
- **路由**: React Router DOM
- **后端**: Express + JSON 文件存储
- **部署**: Docker

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### Docker 部署

```bash
# 设置环境变量（必须）
export ADMIN_PASSWORD=your_secure_password
export API_TOKEN=your_api_token

# 构建并启动容器
./deploy/build.sh
```

## 项目结构

```
├── src/
│   ├── components/     # 组件
│   ├── pages/         # 页面
│   ├── store/         # 状态管理
│   ├── types/         # TypeScript 类型定义
│   └── data/          # 模拟数据
├── deploy/
│   ├── backend/       # 后端服务
│   └── build.sh       # 一键构建脚本
├── public/            # 静态资源
└── Dockerfile         # 容器化配置
```

## 环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| ADMIN_PASSWORD | 管理员密码 | 否 | `159357` |
| API_TOKEN | API 访问令牌（保护数据接口） | 否 | `fitness-api-secret-token-2024` |
| PORT | 服务端口 | 否 | 3000 |
| DATA_DIR | 数据存储目录 | 否 | ./data |

## 安全机制

### 默认凭据

⚠️ **生产环境请务必修改默认凭据！**

| 项目 | 默认值 |
|------|--------|
| 管理员密码 | `159357` |
| API Token | `fitness-api-secret-token-2024` |

### 在线修改密码/Token

登录后可在 **管理面板 → 安全设置** 中修改：
- 修改管理员密码（需重启服务以永久生效）
- 修改 API Token（修改后需重新登录）

### API Token 保护

以下接口需要携带 `X-Api-Token` 请求头：
- `POST /api/challenges` - 创建挑战
- `PUT /api/challenges/:id` - 更新挑战
- `DELETE /api/challenges/:id` - 删除挑战
- `POST /api/upload` - 图片上传
- `POST /api/change-password` - 修改密码
- `POST /api/change-token` - 修改 Token

公开接口（无需 Token）：
- `GET /api/challenges` - 获取挑战列表
- `GET /api/health` - 健康检查

### 测试环境

测试环境使用独立密码 `admin123`，不会影响正式环境数据。

## License

MIT
