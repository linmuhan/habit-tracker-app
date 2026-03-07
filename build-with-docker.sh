#!/bin/bash
# 使用Docker构建APK（如果本地有Docker）

echo "尝试使用Docker构建APK..."

# 创建Dockerfile
cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine

RUN apk add --no-cache python3 make g++ android-tools

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# 安装Expo CLI
RUN npm install -g eas-cli

# 构建APK（需要EXPO_TOKEN环境变量）
CMD ["eas", "build", "--platform", "android", "--profile", "preview", "--non-interactive"]
DOCKERFILE

echo "Dockerfile已创建"
echo "运行以下命令构建："
echo "  docker build -t habit-tracker-build ."
echo "  docker run -e EXPO_TOKEN=你的token habit-tracker-build"
