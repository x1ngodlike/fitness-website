# 健康星球 - Unraid 部署指南

## 功能总览

一个 React + Node.js + JSON 文件持久化的极简"健身挑战"应用。

- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：Express（仅一个文件 `server.js`）
- 数据：单个 JSON 文件 `db.json`，放在 `/data` 卷里，Unraid 宿主映射到 `/mnt/user/appdata/fitness-website`

## 目录结构

```
Fitness website/
├── src/                 # React 前端源码
├── Dockerfile            # 多阶段：先构建前端，再运行后端+托管静态文件
├── .dockerignore         # 忽略 node_modules / dist / IDE 等
├── deploy/
│   ├── docker-compose.yml
│   ├── build.sh          # 一键构建并启动（推荐）
│   └── backend/
│       ├── package.json
│       └── server.js
```

## 在 Unraid 上部署（两种方法）

### 方法一：一键脚本（最推荐）

1. 把整个 `Fitness website` 目录复制到 Unraid 的某个共享目录，例如：
   `/mnt/user/appdata/fitness-website-src/`

2. SSH 登录 Unraid，进入项目根目录：

   ```bash
   cd /mnt/user/appdata/fitness-website-src
   ```

3. 一键构建并启动：

   ```bash
   ./deploy/build.sh
   ```

4. 浏览器访问：`http://<你的-unraid-ip>:5935`

5. 管理员登录密码：`159357`

### 方法二：docker-compose

```bash
cd /mnt/user/appdata/fitness-website-src
docker compose -f deploy/docker-compose.yml up -d --build
# 浏览器访问 http://<你的-unraid-ip>:5935
```

停止/删除：

```bash
docker compose -f deploy/docker-compose.yml down
```

### 方法三：Unraid 社区应用（CA）里手动添加容器

> 如果你更习惯 Unraid 的 Web UI：

1. 在 "Docker" → "Add Container" 中：
   - Repository: `node:20-alpine`（或者先 `docker build -t fitness-website:latest .` 然后用本地镜像）
   - Container Port: `3000` → Host Port: `5935`
   - Volume: `/mnt/user/appdata/fitness-website` → `/data`

> 推荐直接用 **方法一或方法二**，可追踪且不易出错。

## 数据在哪里？

容器内的 `/data/db.json` 映射到主机的 `/mnt/user/appdata/fitness-website/db.json`。

结构如下：

```json
{
  "challenges": [
    {
      "id": "challenge-xxx",
      "theme": "俯卧撑挑战",
      "goal": "...",
      "hostName": "张伟",
      "coverImage": "...",
      "startDate": "2026-01-01",
      "endDate":   "2026-01-31",
      "maxPayout": 500,
      "minStake":  200,
      "status": "active",
      "isBlocked": false,
      "participants": [ { "id": "...", "participantName": "小李", "stake": 200, "side": "support", "result": "pending" } ],
      "createdAt": 1760000000000
    }
  ]
}
```

**备份/迁移**：只要把这个 `db.json` 拷走就行，无需数据库。

## 环境变量

| 变量 | 默认值 | 含义 |
| ---- | ------ | ---- |
| `ADMIN_PASSWORD` | `159357` | 管理员登录密码 |
| `PORT`           | `3000`    | 容器内 HTTP 端口 |
| `DATA_DIR`       | `/data`   | 数据目录（存放 `db.json`） |
| `DIST_DIR`       | `/app/frontend-dist` | 前端静态文件目录（一般不动） |

## 故障排查

### 1. 构建失败 `npm run build / npx vite build exit code: 1`

- 先确认已存在 `.dockerignore`（里面要排除 `node_modules` 和 `dist`），否则本地 `node_modules` 可能被打进镜像导致冲突。
- 在 Unraid 上手动跑一次看详细日志：

  ```bash
  cd /mnt/user/appdata/fitness-website-src
  docker build -t fitness-website:latest . --progress=plain
  ```

- 如果你有 `package-lock.json`，建议让它存在（构建更快且可重复）。
- 如果没有 lockfile 也能工作，脚本会回退到 `npm install --legacy-peer-deps`。

### 2. 页面能打开，但没有挑战数据

- 打开浏览器 DevTools → Console，看 `/api/challenges` 的 HTTP 状态码
- 若 404：容器没正确运行 `server.js`
- 若 200 但空数组：正常，首次启动就是空的，管理员创建挑战后会写入

### 3. 挑战/参与者没保存

- 检查容器日志：`docker logs fitness-website`
- 确认 `db.json` 所在目录有写入权限
- `ls -la /mnt/user/appdata/fitness-website/`

### 4. 想重置数据

```bash
docker rm -f fitness-website
rm -f /mnt/user/appdata/fitness-website/db.json
cd /mnt/user/appdata/fitness-website-src && ./deploy/build.sh
```

## 端口冲突？

修改 `deploy/docker-compose.yml`（或 `deploy/build.sh`）里的 `5935:3000` 为任意你想要的端口即可。
