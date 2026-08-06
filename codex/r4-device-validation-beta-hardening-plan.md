# R4 Device Validation and Beta Hardening Plan

状态：EXECUTION-FIRST · IMPLEMENTATION REQUIRED

R3 已经完成 Android 工程、远程 debug APK 构建和 CI。R4 不再重复“能否编译”，而是把项目推进到可安装测试版：在 Android 模拟器或设备上验证本地资源启动、离线排盘、资料库、返回键和 JSON 导出，并完成测试版所需的版本、隐私、外部链接和品牌资源收口。

默认优先级：

```text
设备可用闭环 > 原生导出与隐私 > 自动化设备验证 > 测试版品牌与版本 > 文档
```

## 1. 本轮目标

1. 修正 R3 合并后的仓库状态和过期版本标识。
2. 建立统一测试版版本信息，并在 Web、About 页和 Android 包中保持一致。
3. 让 Android 上的 JSON 复制、保存或分享具有明确可用的原生路径。
4. 将外部来源链接交给系统浏览器处理，应用自身不后台访问来源页面。
5. 收紧 Android 权限和备份配置，维持本地优先边界。
6. 替换 Capacitor 默认图标与 splash，形成最小但真实的项目品牌。
7. 增加 Android 离线设备 smoke，验证真实安装包而非只验证 Gradle 编译。
8. 继续产出短期 debug APK、设备测试报告和代表性截图。
9. 推送新的 R4 实现分支并创建面向 `main` 的 PR，不自行合并。

## 2. 本轮不做

- 不修改六宫顺序、月日时公式、算法 ID、固定测试向量。
- 不修改知识语义、传统文本、领域解释和伦理规则。
- 不加入账号、云同步、社区、广告、遥测或崩溃上报。
- 不加入生成式 AI、远程断语或用户问题上传。
- 不制作签名 release APK、AAB、Play 商店素材或正式商店发布。
- 不开发 PDF、PNG、长图和复杂设置中心。
- 不重新审查 R1、R2、R3 已通过部分。
- 不使用坐标点击作为长期设备测试方案。

## 3. Git 与调度

使用单一实现分支：

```text
feature/r4-device-validation-beta-hardening
```

只有主代理执行 Git、依赖安装、Capacitor sync、Gradle、Android 模拟器、CI、提交、推送和 PR 操作。

本轮允许 0–3 个窄子代理：

- `native-export-agent`：只处理 `src/platform/**`、`src/app/ResultTools.tsx` 和对应测试。
- `android-smoke-agent`：只处理 Android 测试、稳定选择器和设备 smoke 脚本，不修改业务算法。
- `branding-agent`：只处理项目自有图标、splash 源文件及 Android 资源，不修改应用逻辑。

主代理从开始起持续负责版本、Android manifest、外部链接、CI、整合、设备验证和 PR 收尾，不等待全部子代理结束。

## 4. 启动阅读范围

主代理只读取：

1. `README.md`
2. `codex/execution-first-policy.md`
3. 本计划
4. `package.json`
5. `vite.config.ts`
6. `capacitor.config.ts`
7. `.github/workflows/ci.yml`
8. `android/app/build.gradle`
9. `android/app/src/main/AndroidManifest.xml`
10. `src/app/App.tsx`
11. `src/app/ResultTools.tsx`
12. `src/pages/about/AboutPage.tsx`
13. 来源链接直接依赖的组件
14. `docs/r3-android-build.md`

不得先进行全仓扫描或生成新的分析报告。

## 5. Work Package A：R3 状态与测试版版本

更新 `README.md`：

- 标记 R3 已审阅并合并到 `main`。
- 记录 GitHub Android build 和 APK artifact 已形成闭环。
- 下一阶段改为 R4 Device Validation and Beta Hardening。
- Codex 开发入口切换到本计划。
- 删除“R3 等待审阅”等过期描述。

统一测试版版本：

```text
package name: xiaoliurenarchive
version: 0.4.0-beta.1
Android versionName: 0.4.0-beta.1
Android versionCode: 401
build channel: beta-debug
```

要求：

- `package.json` 不再使用 `xiaoliuren-r1`。
- `index.html` 标题改为稳定产品名，不再显示 `R2`。
- About 页显示应用版本、构建渠道、算法版本、知识版本和“本地优先/不上传”的边界。
- 新增 `npm run validate:version`，失败闭合校验 package 版本、Android `versionName/versionCode` 与应用展示版本的一致性。
- `npm run build` 和 CI 必须运行版本校验。
- 不把 Git SHA、构建时间等不稳定字段写入确定性业务结果。

## 6. Work Package B：Android 原生 JSON 导出

当前 Web Blob 下载不能视为 Android 已验证导出。增加平台适配层，例如：

```text
src/platform/export-result.ts
```

Android 原生路径使用同一 Capacitor 主版本的必要插件：

- `@capacitor/clipboard`
- `@capacitor/filesystem`
- `@capacitor/share`

要求：

- 浏览器继续支持现有 Clipboard API 和 `.json` 下载。
- Android “复制 JSON”使用 Capacitor Clipboard。
- Android 第二操作改为“保存/分享 JSON”，将 UTF-8 JSON 写入应用缓存目录，再调用系统分享面板。
- 不请求广泛存储权限，不直接写公共存储根目录。
- 文件名使用稳定、无问题文本的格式，例如 `xiaoliuren-result.json`。
- 默认隐私导出仍移除问题原文与精确时间；不得绕过既有 `serializeExportPayload`。
- 分享失败、取消或插件不可用时显示准确状态，不声称已保存。
- Web 和 Android 逻辑通过统一服务接口调用，组件内不复制平台判断。
- 增加平台适配测试，至少覆盖 Web 下载、Android Clipboard、Android Share 失败和默认隐私字段。

## 7. Work Package C：来源链接与 Android 隐私配置

外部来源链接只能由用户主动点击后打开。

要求：

- 增加统一外部链接组件或平台服务。
- Web 使用普通安全链接：`target="_blank"` 与 `rel="noreferrer noopener"`。
- Android 使用同一 Capacitor 主版本的 `@capacitor/browser` 或等价系统浏览器方案。
- 应用不得在 WebView 内替换当前本地页面，也不得后台 fetch 来源页面。
- 现有运行时网络审计继续通过。

Android manifest 收口：

- 验证系统浏览器方案可用后，移除应用自身不必要的 `android.permission.INTERNET`。
- 设置 `android:usesCleartextTraffic="false"`。
- 设置 `android:allowBackup="false"`，避免未来本地问题数据被系统备份。
- 不加入网络安全例外、开发服务器地址或远程 `server.url`。
- 新增 manifest 审计脚本或测试，确保上述约束不会回归。

## 8. Work Package D：项目图标与启动页

替换 Capacitor 默认 Android 图标和 splash。

设计约束：

- 使用仓库原创的简洁“六宫循环/六点环形”符号。
- 不使用神像、符咒、恐吓性图像或制造权威感的宗教拟物。
- 保持当前米白、深绿、灰绿的界面语气。
- 图标在小尺寸下仍清晰，adaptive icon 前景不得贴边。
- splash 只显示项目符号和产品名，不显示预测性口号。
- 保存一份可维护的 SVG 或其他源文件，生成 Android 各密度资源。
- 不下载或改造网络素材。
- 删除残留的 Capacitor 默认机器人图标和默认 splash。

只保留一组必要源资产和生成结果，不加入冗余设计过程文件。

## 9. Work Package E：稳定设备测试接口

为真实 Android smoke 增加少量稳定选择器：

- 主导航：排盘、资料库、关于。
- 手动农历输入：月、日、时辰。
- 提交按钮。
- 最终宫位结果。
- 资料库搜索框。
- 结构化详情。
- 复制 JSON 与保存/分享 JSON。

要求：

- 使用稳定 `id`、ARIA label 或 `data-testid`，不得使用文本层级和屏幕坐标作为唯一定位。
- 选择器只服务测试和可访问性，不得改变算法或表单默认值。
- 为关键按钮补齐可访问名称和状态反馈。
- 浏览器 Playwright smoke 继续使用相同稳定选择器。

## 10. Work Package F：Android 离线设备 smoke

新增一个窄 Android 设备测试闭环。优先使用 Espresso-Web、UiAutomator 或等价稳定方案，不使用硬编码坐标。

最低交互流程：

1. 安装本轮生成的 debug APK。
2. 关闭模拟器 Wi-Fi 与移动数据，或使用无网络配置。
3. 启动应用并确认没有白屏或崩溃。
4. 使用默认手动农历三月初五辰时提交，确认结果为小吉。
5. 打开资料库，搜索并显示“小吉”。
6. 使用系统返回键回到排盘页。
7. 打开结果导出，至少验证“复制 JSON”成功。
8. 验证 About 页显示 `0.4.0-beta.1` 与本地优先说明。
9. 检查 logcat，不得出现应用 `FATAL EXCEPTION`、WebView 主资源加载失败或远程服务器依赖错误。

测试实现要求：

- Android 测试包名使用实际 applicationId。
- 设备测试只建立 1–3 个有意义的 smoke test，不恢复 Capacitor 模板空测试。
- 若使用 Espresso-Web，补充最小必要依赖并通过稳定 DOM 选择器操作。
- 若某个系统分享面板无法稳定自动化，设备测试只验证分享调用已发起；最终人工 smoke 再确认面板可见。
- 失败只调查 Android 壳层、选择器或平台服务，不回溯核心算法。

## 11. Work Package G：设备 CI 与测试包交付

保留现有 Web verify 和 Android debug build job，新增设备 smoke 工作流，例如：

```text
.github/workflows/android-device-smoke.yml
```

触发：

- `workflow_dispatch`
- PR 中 Android、平台适配、导航、导出或移动端样式发生变化时

要求：

- 使用 Ubuntu、JDK 21、兼容 Android SDK/emulator image。
- 第三方 emulator action 必须选择维护中的版本并固定到完整 commit SHA。
- 先执行 `npm ci`、版本校验、mobile sync 和 debug APK 构建。
- 启动 emulator，安装 APK，关闭网络并运行设备 smoke。
- 上传设备测试报告、logcat 和 1–3 张代表性截图。
- 成功时上传短期 `xiaoliurenarchive-beta-debug-apk`，保留 7 天。
- APK、截图和报告不提交到 Git。
- emulator 基础设施不可用时必须报告明确阻塞，不得把“只编译 APK”写成设备 smoke 通过。

现有 `.github/workflows/ci.yml` 中的 Android build job继续作为快速编译门槛，设备 smoke 可作为独立较慢门槛。

## 12. Work Package H：构建与安装文档

新增：

```text
docs/r4-beta-device-test.md
```

只记录：

- 从 GitHub Actions 下载短期 debug APK 的位置。
- `adb install -r` 的安装命令。
- 本地 Android SDK 可用时的构建命令。
- 设备 smoke 的执行命令。
- debug APK 未签名用于商店分发、不得作为正式 release 的说明。
- 当前离线、权限、备份和系统浏览器边界。

不得写商店发布教程、签名密钥或冗长过程日志。

## 13. 实施顺序

1. 主代理更新版本、README、index 标题和 About 页。
2. 主代理增加版本一致性校验并接入 build/CI。
3. 实现统一原生导出服务和测试。
4. 实现统一外部链接服务，随后收紧 Android manifest。
5. 生成并接入原创图标与 splash。
6. 加入稳定选择器和最小可访问性修正。
7. 建立 Android 设备 smoke。
8. 建立设备 CI、artifact、报告和截图上传。
9. 更新 R4 设备测试文档。
10. 执行必要验证，提交、推送并创建 R4 PR。

## 14. 必要本地验证

必须实际运行并报告：

```text
npm run validate:version
npm run validate:knowledge
npm run audit:network
npm run typecheck
npm run build
npm test
npm run mobile:sync
```

本机 Android SDK 可用时运行：

```text
npm run mobile:build:debug
```

若本机有 emulator 或设备，再运行设备 smoke；否则由 GitHub 设备 workflow 提供远程验证。

现有 CI 仍负责：

```text
npm run test:core
npm run test:ethics
```

不得为了本轮视觉和原生导出修改而重新人工审查核心算法。

## 15. 完成标准

- README 正确标记 R3 已合并、R4 正在实施。
- package、Web、About 页和 Android 版本一致。
- 浏览器导出无回归。
- Android 可复制并保存或分享隐私 JSON。
- 外部来源链接由系统浏览器打开，应用不后台请求。
- Android 不保留不必要 INTERNET 权限，不允许 cleartext，不允许系统备份。
- 默认 Capacitor 图标和 splash 已替换。
- debug APK 在无网络 emulator 或设备上完成排盘、资料库、返回键和复制 JSON smoke。
- 设备 CI 真实运行并提供报告、logcat、截图和短期 APK artifact。
- 未完成或基础设施阻塞被准确写入 PR。
- 不引入签名、商店、账号、云服务或生成式 AI。
- 新实现分支已推送并创建面向 `main` 的 PR。
- 不自行合并 PR。

## 16. 失败处理

- 原生导出失败：只检查平台适配、插件 sync、文件 URI 和系统分享，不修改结果序列化语义。
- 外部链接失败：只检查系统浏览器插件与 manifest，不恢复 WebView 内远程导航。
- 移除 INTERNET 权限导致核心本地功能失败：视为配置错误，定位 WebView/Capacitor 配置；不得直接恢复远程依赖。
- emulator 启动失败：只检查虚拟化、system image、action 和超时。
- Espresso-Web 或 UiAutomator 不稳定：改用稳定选择器和等待条件，不使用固定坐标或长时间 sleep。
- 图标生成失败：只检查源 SVG、adaptive icon safe zone 和资源生成，不重做界面。
- CI 失败：只修失败 job 涉及的模块，不重复运行所有手工 smoke。

## 17. Git 收尾

完成后执行：

```text
git status --short
git diff --check
git add -A
git commit -m "feat: validate Android beta on device"
git push -u origin feature/r4-device-validation-beta-hardening
```

创建新 PR：

```text
base: main
head: feature/r4-device-validation-beta-hardening
title: feat: add R4 Android device validation and beta hardening
```

PR 描述必须包含：

- 完成项
- 未完成项
- 已知问题
- 版本与权限状态
- 本地验证
- Web/Android build CI 状态
- 设备 smoke 状态
- APK、截图和报告 artifact 名称
- 分支与提交 SHA

不得自行合并 PR。
