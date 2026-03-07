#!/bin/bash
# 安装expo-dev-client用于本地构建
npm install expo-dev-client

# 使用expo prebuild生成原生项目
npx expo prebuild --platform android

# 构建APK
cd android
./gradlew assembleRelease

echo "APK位置: android/app/build/outputs/apk/release/app-release.apk"
