#!/bin/bash
#
# 壹拳俱乐部 - 一键部署脚本（Unraid / macOS / Linux 均可执行）
# 用法：chmod +x deploy/build.sh && ./deploy/build.sh
#
# 环境变量（可选，未设置时使用默认值）：
#   ADMIN_PASSWORD - 管理员密码（默认：159357）
#   API_TOKEN - API Token（默认：fitness-api-secret-token-2024）
#

set -e

cd "$(dirname "$0")/.."

# 默认值
ADMIN_PASSWORD="${ADMIN_PASSWORD:-159357}"
API_TOKEN="${API_TOKEN:-fitness-api-secret-token-2024}"

echo "============================================="
echo " 步骤 1/4 — 停止并删除旧容器"
echo "============================================="
if docker ps -a --format '{{.Names}}' | grep -q '^fitness-website$'; then
  echo "检测到已存在容器 'fitness-website'，正在删除..."
  docker rm -f fitness-website
  echo "旧容器已删除。"
else
  echo "未找到旧容器，跳过此步骤。"
fi

echo
echo "============================================="
echo " 步骤 2/4 — 清理旧构建产物"
echo "============================================="
rm -rf dist
echo "清理完成"

echo
echo "============================================="
echo " 步骤 3/4 — 构建 Docker 镜像"
echo "============================================="
echo "正在构建 Docker 镜像，请稍候..."
docker build -t fitness-website:latest .

echo
echo "============================================="
echo " 步骤 4/4 — 启动容器（端口 5935）"
echo "============================================="
echo "正在启动容器..."
docker run -d \
  --name fitness-website \
  --restart unless-stopped \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e API_TOKEN="$API_TOKEN" \
  -v /mnt/user/appdata/fitness-website:/data \
  -p 5935:3000 \
  fitness-website:latest

echo
echo "✅ 部署完成！访问地址：http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo '你的服务器IP'):5935"
echo ""
echo "📝 默认凭据："
echo "   管理员密码: $ADMIN_PASSWORD"
echo "   API Token: $API_TOKEN"
echo ""
echo "常用命令："
echo "   docker logs -f fitness-website   # 查看日志"
echo "   docker stop fitness-website       # 停止服务"
