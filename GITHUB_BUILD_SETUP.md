# GitHub自动构建APK方案

## 方案说明
用GitHub Actions自动构建APK，构建完成后APK会出现在GitHub的Actions页面，你可以直接下载。

## 需要我做的事：
1. 登录你的GitHub账号
2. 创建新仓库（如：habit-tracker-app）
3. 推送代码到仓库
4. 配置GitHub Actions工作流
5. 触发构建并等待完成

## 你需要提供的：
- GitHub用户名
- GitHub密码 或 Personal Access Token
- （可选）邮箱（用于接收构建通知）

## 技术细节：
GitHub Actions构建APK有两种方式：

### 方式A：EAS Cloud构建（推荐）
- 仍需Expo账号（可以在GitHub Secrets里配置）
- 构建在Expo云服务器上进行
- 完成后APK链接会显示在GitHub Actions日志中

### 方式B：纯GitHub Actions构建（无需Expo）
- 使用GitHub提供的Ubuntu服务器
- 安装Android SDK进行本地构建
- 完全免费，无需第三方账号
- 构建时间约10-15分钟

## 安全提醒：
提供GitHub密码有一定风险，建议：
1. 使用临时密码，完成后立即修改
2. 或者使用Personal Access Token（更安全，可限制权限）
3. 或者你回家后自己操作（我提供详细步骤）

