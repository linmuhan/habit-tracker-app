# APK构建指南

## 方案：EAS Cloud构建（推荐）

### 1. 注册Expo账号
访问 https://expo.dev/signup 用邮箱注册

### 2. 安装EAS CLI
```bash
cd /Users/openclaw/.openclaw/workspace/projects/habit-tracker
npm install -g eas-cli
```

### 3. 登录Expo
```bash
eas login
# 输入注册的邮箱和密码
```

### 4. 配置项目（已完成）
app.json 和 eas.json 已配置好

### 5. 构建APK
```bash
# 构建预览版APK（免费）
eas build --platform android --profile preview

# 或者构建正式版
eas build --platform android --profile production
```

### 6. 下载APK
构建完成后会给出下载链接，点击即可下载APK文件

---

## 本地构建（备选）

如果需要本地构建，先安装环境：

```bash
# 1. 安装Java
brew install openjdk@17

# 2. 安装Android SDK
brew install android-sdk

# 3. 设置环境变量
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 4. 安装构建工具
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# 5. 构建
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK位置：`android/app/build/outputs/apk/release/app-release.apk`
