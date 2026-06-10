# 健康星球 - 群健康挑战赛

一个基于 React + TypeScript + Vite 的健康挑战管理平台。

## 功能特性

- 🎯 创建和管理健康挑战
- 👥 用户参与挑战（支持/反对）
- 🏆 挑战结果确认与奖金分配
- 🔐 管理员面板（编辑、封档、删除挑战）
- 📊 进度条显示挑战剩余时间
- 🌐 测试环境与正式环境切换

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

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| ADMIN_PASSWORD | 管理员密码 | 159357 |
| PORT | 服务端口 | 3000 |
| DATA_DIR | 数据存储目录 | ./data |

## 管理员登录

密码：`159357`

## License

MIT