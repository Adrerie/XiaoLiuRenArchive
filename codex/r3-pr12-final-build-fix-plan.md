# PR #12 Android Build Finalization Plan

状态：EXECUTION-FIRST · TARGETED FINALIZATION

本轮只关闭 PR #12 的 Android 构建与交付证据缺口。不得重新审查或修改 R1/R2 核心算法、知识语义、伦理规则、公历策略和既有界面。

默认优先级：

```text
Android 可构建闭环 > CI 真实验证 > PR 交付报告 > 文档同步
```

## 1. 本轮目标

1. 将 debug APK 构建命令改为 Windows、Linux、macOS 均可执行。
2. 在 GitHub Actions 中真实执行 Android `assembleDebug`。
3. CI 成功时上传短期 debug APK artifact。
4. 删除或修正 Capacitor 模板测试中的错误包名。
5. 补齐 PR #12 描述和真实 Android 构建状态。
6. 继续更新原分支和原 PR #12，不创建新实现分支或新 PR，不自行合并。

## 2. 启动与调度

当前实现分支必须为：

```text
feature/r3-mobile-packaging-release
```

主代理只读取：

1. 本计划
2. `package.json`
3. `.github/workflows/ci.yml`
4. `docs/r3-android-build.md`
5. `android/gradlew`
6. `android/gradlew.bat`
7. `android/app/src/androidTest/**`
8. `android/app/src/test/**`

不得全仓扫描。只有主代理执行 Git、依赖、Gradle、CI 和 PR 操作。本轮任务较小，默认不创建子代理。

## 3. 跨平台 Android debug 构建

新增一个窄脚本，例如：

```text
scripts/build-android-debug.mjs
```

要求：

- 使用 Node `process.platform` 判断平台。
- Windows 在 `android/` 目录调用：

```text
gradlew.bat assembleDebug
```

- Linux/macOS 在 `android/` 目录调用：

```text
./gradlew assembleDebug
```

- 继承标准输入输出，失败时向 npm 返回原始非零退出码。
- 不使用全局 Gradle，不绕过仓库中的 wrapper。
- `android/gradlew` 必须具备 Git 可执行权限。执行并提交权限变化：

```text
git update-index --chmod=+x android/gradlew
```

调整 `package.json`：

```text
mobile:build:debug = npm run mobile:sync && node scripts/build-android-debug.mjs
```

不得继续在 npm script 中硬编码 `gradlew.bat`。避免重复执行无必要的 Web build 与 `cap sync`。

同步更新 `docs/r3-android-build.md`，明确 npm 命令已经自动选择平台 wrapper，用户不需要手工改命令。

## 4. 清理错误 Android 模板测试

当前模板 instrumentation test 断言旧包名：

```text
com.getcapacitor.app
```

实际应用 ID 为：

```text
io.github.adrerie.xiaoliurenarchive
```

优先删除未承载项目行为的两个模板测试：

```text
android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java
android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java
```

若保留 instrumentation test，则必须：

- 路径与 Java package 使用项目命名空间。
- 包名断言改为真实 applicationId。
- 不声称该模板测试验证了应用功能。

不得新增模拟器测试矩阵，本轮只保证 Android 工程可编译。

## 5. Android GitHub CI

保留当前通过的 Web/knowledge verify job。新增独立 Android debug job，可在 verify 成功后执行。

Android job 必须：

1. checkout 当前提交。
2. 设置与项目兼容的 Node 主版本。
3. 设置 JDK 21。
4. 设置 Android SDK 环境。
5. 执行：

```text
npm ci
npm run mobile:sync
chmod +x android/gradlew
cd android
./gradlew assembleDebug --no-daemon
```

6. 确认产物存在：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

7. 上传 workflow artifact，建议名称：

```text
xiaoliurenarchive-debug-apk
```

要求：

- artifact 只短期保留，不提交 APK 到 Git。
- 不使用签名密钥、secrets、Firebase、遥测或发布凭据。
- Android job 失败时只检查该 job 的 Gradle/JDK/SDK日志，不回溯 Web 核心实现。
- CI 不要求启动模拟器或执行 instrumentation test。

## 6. 定向验证

本地必须运行：

```text
npm run typecheck
npm run build
npm test
npm run mobile:sync
```

本机 Android SDK 与 JDK 可用时继续运行：

```text
npm run mobile:build:debug
```

并确认：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

本机工具链不可用时，不得伪称本地 APK 通过。准确记录具体阻塞，例如缺少 Android SDK、platform 36、build-tools 或 JDK 21。此时必须以新增的远程 Android CI 作为构建证据。

不重复运行本地 `test:core`、`test:ethics`、浏览器 smoke 或截图。它们未被本轮修改，现有 CI 会继续验证核心测试。

## 7. PR #12 报告

推送修正后更新原 PR #12 描述，不创建新 PR。PR 描述必须包含：

### 完成项

- 跨平台 Gradle wrapper 选择。
- Android CI `assembleDebug`。
- APK artifact。
- 模板测试处理。
- R2 来源状态分类仍保持正确。

### 未完成项

- 无则写“无”。
- 未进行模拟器或真机 smoke 时明确说明，不得暗示已经运行。

### 已知问题

- 仅记录真实存在的问题。
- 本机没有 Android 工具链时写明本地 APK 未生成，但远程 CI 构建结果必须单列。

### 实际验证

列出每条命令及结果，不写模糊的“已测试”。

### Android 构建状态

分别写：

```text
Local Android build: success / blocked + 原因
GitHub Android build: success / pending / failed
APK artifact: available / unavailable
```

### CI 状态

写明 Web verify job 与 Android debug job 的真实状态。

使用：

```text
gh pr edit 12 --body-file <prepared-pr-body-file>
```

## 8. CI 收口

推送后只等待本次最新 CI 运行完成一次：

```text
gh pr checks 12 --watch
```

若 Android job 失败，只修复 Android job 对应问题并再次推送。不得借机重构应用。

CI 成功后确认 artifact 已生成。无需下载或提交 APK 到仓库。

## 9. Git 收尾

在现有实现分支完成：

```text
git status
git add -A
git commit -m "fix: complete cross-platform Android debug build"
git push origin feature/r3-mobile-packaging-release
```

随后更新 PR #12 描述并等待 CI。不得创建重复 PR，不得自行合并。

## 10. 完成标准

- `mobile:build:debug` 不再固定调用 Windows wrapper。
- `android/gradlew` 可在 POSIX CI 执行。
- 错误模板包名测试已删除或修正。
- GitHub CI 包含成功的 Android `assembleDebug` job。
- CI 生成 debug APK artifact。
- Web verify job继续通过。
- PR #12 描述完整反映本地和远程构建事实。
- 原 PR #12 已更新，未创建新实现 PR，未自行合并。

最终报告只包含：完成项、未完成项、已知问题、本地验证、Android CI、artifact、提交 SHA、PR 链接。