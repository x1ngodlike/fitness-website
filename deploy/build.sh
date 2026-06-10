#!/bin/bash
#
# 一键构建脚本（Unraid / macOS / Linux 都可执行）
# 用法：chmod +x deploy/build.sh && ./deploy/build.sh
#

set -e

cd "$(dirname "$0")/.."

echo "============================================="
echo " Step 1/3 — Clean old build artifacts"
echo "============================================="
rm -rf dist
echo "OK"

echo
echo "============================================="
echo " Step 2/3 — Docker build"
echo "============================================="
docker build -t fitness-website:latest .

echo
echo "============================================="
echo " Step 3/3 — Run container (port 5935)"
echo "============================================="
docker rm -f fitness-website 2>/dev/null || true
docker run -d \
  --name fitness-website \
  --restart unless-stopped \
  -e ADMIN_PASSWORD=159357 \
  -v /mnt/user/appdata/fitness-website:/data \
  -p 5935:3000 \
  fitness-website:latest

echo
echo "✅ Done. Open http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'your-server-ip'):5935"
echo "   docker logs -f fitness-website   # 查看日志"
echo "   docker stop fitness-website       # 停止"
