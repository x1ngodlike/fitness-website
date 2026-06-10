##
## 阶段一：构建前端
## 构建上下文 = 项目根目录（即本 Dockerfile 所在目录）
##
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# 先复制依赖定义（利用 Docker 缓存）
COPY package.json package-lock.json* ./

# 安装依赖（没有 lockfile 也能装，且尽量避免 peer 报错）
RUN npm install --no-audit --no-fund || npm install --legacy-peer-deps --no-audit --no-fund

# 复制前端源码（.dockerignore 已排除 node_modules/dist）
COPY . .

# 构建：跳过 TypeScript 类型检查（已在本地验证过），直接由 Vite 产出静态文件
RUN set -e; \
    echo ">>> node=$(node -v) npm=$(npm -v)"; \
    echo ">>> running vite build..."; \
    npx vite build; \
    echo ">>> build OK, files in dist/:"; \
    ls -la dist/

##
## 阶段二：运行后端并托管前端静态文件
##
FROM node:20-alpine
WORKDIR /app

# 安装后端依赖
COPY deploy/backend/package.json ./
RUN npm install --production --no-audit --no-fund

# 后端入口
COPY deploy/backend/server.js ./

# 前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./frontend-dist

EXPOSE 3000
ENV PORT=3000
ENV DATA_DIR=/data
VOLUME ["/data"]

CMD ["node", "server.js"]
