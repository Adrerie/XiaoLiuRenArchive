# R3 Mobile Packaging and Release Audit Plan

状态：EXECUTION-FIRST · IMPLEMENTATION REQUIRED

本轮将 R2 遗留的来源状态分类修正与 R3 Mobile Packaging 合并执行。不得先开独立补丁 PR，也不得只完成文档或 Capacitor 空壳后停止。

默认优先级：

```text
实际实现 > Android 可运行闭环 > 核心回归测试 > 发布审计 > 文档记录
```

## 1. 本轮目标

在不改变冻结起课算法、解释语义和伦理规则的前提下，完成以下闭环：

1. 修正 `provisionalSourceIds` 的状态分类语义。
2. 将现有 Web 应用打包为本地优先的 Capacitor Android 应用。
3. 确保排盘、资料库、伦理过滤和 JSON 导出在 Android WebView 中离线可用。
4. 增加安全区、系统返回键和移动端基础适配。
5. 增加自动化网络审计与 GitHub CI，使构建和测试不再只依赖本地报告。
6. 在本机工具链可用时生成 debug APK；工具链缺失时保留完整 Android 工程并准确报告阻塞。
7. 推送实现分支并创建面向 `main` 的新 PR，不自行合并。

## 2. 禁止事项

- 不修改六宫顺序、月日时公式、算法 ID 或固定测试向量。
- 不引入生成式 AI、远程断语、账号、云同步、社区或分析追踪。
- 不增加广告、遥测、崩溃上报或用户问题上传。
- 不开发 PDF、PNG、长图、正式商店发布或签名 release 包。
- 不重新扫描整个仓库，不重做 R1/R2 已通过审阅。
- 不为每个子任务创建分支、提交或独立报告。
- 不提交 APK、AAB、Gradle 缓存、Android Studio 本地配置或密钥文件。

## 3. Git 与调度规则

- 使用单一实现分支：`feature/r3-mobile-packaging-release`。
- 只有主代理执行 Git、依赖安装、Capacitor CLI、Gradle、提交、推送和 PR 操作。
- 子代理共享当前工作区，不切分支、不提交、不 cherry-pick。
- 主代理不得等待所有子代理结束后才开始工作。
- 主代理从开始起持续负责：Capacitor 依赖与配置、Vite/Android 接线、应用生命周期与返回键、CI 与网络审计、Android 构建、集成测试和 PR 收尾。
- 子代理完成一个窄任务后，主代理立即检查并接入。
- 文件冲突只处理受影响文件，不重置工作区。

## 4. 启动阅读范围

主代理只读取：

1. `README.md`
2. `AGENTS.md`
3. `CODEX_MASTER_PROMPT.md`
4. `codex/execution-first-policy.md`
5. 本计划
6. `package.json`
7. `vite.config.ts`
8. `src/app/App.tsx`
9. `src/app/divination-runtime.ts`
10. `src/styles/index.css`
11. `docs/10-product-requirements.md`

随后立即执行。不得先生成新的分析报告。

## 5. Work Package A：R2 来源状态收口

修改来源状态分类，使：

```text
unverified / provisional -> provisionalSourceIds
verified-url / reviewed / canonical -> 不进入 provisionalSourceIds
```

要求：

- 使用集中函数判断来源是否 provisional，不在多个组件复制字符串判断。
- 项目编辑来源 `xiaoliurenarchive-editorial-modern-knowledge-v1` 当前为 `reviewed`，不得再进入 `provisionalSourceIds`。
- 网络录文等 `provisional` 来源继续进入。
- UI 与 JSON 导出保持现有字段合同。
- 增加普通结果测试，明确同时包含 reviewed 和 provisional 来源时分类正确。
- 不改动来源内容和传统文本状态。

## 6. Work Package B：Capacitor Android 工程

在当前 React/Vite 工程上建立 Capacitor Android 容器。

要求：

- 安装同一稳定主版本的 `@capacitor/core`、`@capacitor/cli`、`@capacitor/android`。仅在实际需要返回键集成时加入 `@capacitor/app`。
- 新增 `capacitor.config.ts`。
- 固定应用标识：

```text
appId: io.github.adrerie.xiaoliurenarchive
appName: 小六壬档案
webDir: dist
```

- 调整 Vite 资源基路径，使构建产物可从 Capacitor 本地协议加载，且普通 Web 开发模式不受影响。
- 创建并提交 `android/` 工程。
- 增加 npm scripts，至少包括：

```text
mobile:sync
mobile:open
mobile:build:debug
```

- `mobile:build:debug` 必须先完成知识校验和 Web build，再同步 Android，最后调用平台对应的 Gradle debug 构建。
- Windows 环境优先使用 `gradlew.bat assembleDebug`。
- 不启用远程 `server.url`，不得把开发服务器地址写入正式配置。

## 7. Work Package C：Android 壳层体验

只处理 Android 闭环必需的界面与生命周期问题。

要求：

- 应用根布局支持 `env(safe-area-inset-top/right/bottom/left)`。
- 保持 360px 宽度下排盘、资料库和结果页可使用。
- Android 系统返回键行为：
  1. 当前位于资料库或关于页时，先返回排盘页。
  2. 当前结果已展开时，不应立即退出并丢失上下文，可先回到输入区或清除当前次级视图。
  3. 已处于应用根状态时允许系统默认退出。
- 浏览器 Web 运行时不得因为 Capacitor API 不存在而报错。
- 外部来源链接保持用户主动点击后打开，不得后台请求来源页面。
- 不加入复杂动画、底部导航重构或新视觉体系。

## 8. Work Package D：离线与网络审计

新增：

```text
scripts/audit-runtime-network.mjs
npm run audit:network
```

审计目标：

- 阻止应用执行代码中出现未经批准的 `fetch(`、`XMLHttpRequest`、`WebSocket`、`EventSource`、`navigator.sendBeacon`、远程脚本、远程样式、分析或遥测 SDK。
- 允许知识数据中的外部来源 URL 和用户主动点击的普通 `<a href>`。
- 不允许通过简单全仓 URL 搜索制造误报。
- 审计失败必须返回非零退出码并指出文件。
- `npm run build` 或 CI 必须运行该审计。

进行一次离线 smoke：

1. 完成构建和 Android 同步。
2. 在不依赖开发服务器的环境中打开打包资源。
3. 完成手动农历排盘。
4. 完成公历排盘。
5. 打开六宫资料库并搜索“小吉”。
6. 打开结构化详情并生成 JSON。
7. 确认没有网络请求错误导致核心功能失败。

## 9. Work Package E：GitHub CI

新增最小 GitHub Actions 工作流，为 PR 和 `main` 提供独立可见的自动验证。

CI 必须运行：

```text
npm ci
npm run validate:knowledge
npm run audit:network
npm run typecheck
npm run build
npm test
npm run test:core
npm run test:ethics
```

要求：

- 使用当前受维护的官方 actions 版本。
- 固定 Node 主版本并与项目实际兼容。
- 不上传用户数据，不配置 secrets。
- Android debug 构建可在同一工作流或独立 job 中运行。
- Android job 若加入，必须配置兼容 JDK，并执行 `npx cap sync android` 和 debug assemble。
- 可选上传 debug APK 作为短期 workflow artifact，但不得提交到 Git。

## 10. Work Package F：文档与版本状态

更新 `README.md`：

- 标记 R2 已合并完成。
- 下一阶段改为 R3 Mobile Packaging。
- 实现完成后标记 R3 当前真实状态。
- Codex 开发入口切换到本计划。
- 删除“R2 PR 待审阅”等过期描述。

新增：

```text
docs/r3-android-build.md
```

只记录必要 Node、JDK、Android SDK/Gradle 环境，Web build、Capacitor sync、Android debug build 命令，APK 典型输出路径与离线边界。不得写签名密钥、商店发布或冗长过程日志。

## 11. 窄子任务

主代理可按当前并发能力使用 0–3 个子代理。只有任务确实并行时才创建。

### source-status-agent

只读/写：`src/knowledge/**`、`src/app/divination-runtime.test.ts`

任务：修正 `provisionalSourceIds` 分类及测试。

### mobile-ui-agent

只读/写：`src/app/**`、`src/styles/**`

任务：安全区和返回键所需的最小 UI 接口。不得改核心运行时和 Git。

### release-audit-agent

只读/写：`scripts/audit-runtime-network.mjs` 及对应测试。

任务：实现定向网络审计。不得修改 Android、依赖或 CI。

主代理自己完成 Capacitor、Android、CI、构建、整合和 PR 收尾。

## 12. 实施顺序

1. 主代理修正来源状态分类并接入测试。
2. 主代理安装 Capacitor 依赖、添加配置、调整 Vite base。
3. 主代理创建 Android 工程并加入 npm scripts。
4. 并行处理安全区/返回键和网络审计。
5. 主代理整合 Android 壳层。
6. 添加 CI。
7. 运行定向验证。
8. 本机 Android 工具链可用时生成 debug APK。
9. 更新 README 和 Android 构建文档。
10. 提交、推送并创建 R3 PR。

## 13. 必要验证

必须实际运行并报告：

```text
npm run validate:knowledge
npm run audit:network
npm run typecheck
npm run build
npm test
npm run test:core
npm run test:ethics
npm run mobile:sync
```

本机存在可用 Android SDK/JDK 时还必须运行：

```text
npm run mobile:build:debug
```

浏览器关键 smoke：手动农历、公历 23:00、明确拒绝 hard-block、人员危险 hard-stop、资料库搜索、默认隐私 JSON 导出、360px 布局。

Android smoke 在可运行模拟器或设备时只检查：启动无白屏、离线完成一次排盘、资料库可打开、返回键行为正确、JSON 复制或下载至少一种可用。

不得为了截图重新执行全部测试。保留 2–4 张代表性截图即可。

## 14. 失败处理

- Capacitor 初始化失败：只检查依赖版本、配置与当前平台。
- Gradle 失败：只检查 JDK、Android SDK、Gradle 日志和 Android 工程。
- 本机缺少 Android SDK/JDK：完成全部 Web、Capacitor、Android 工程和 CI 工作，准确记录本地 APK 未生成，不得伪称通过。
- 返回键失败：只检查生命周期接线和视图状态。
- 网络审计误报：缩小执行代码范围或增加明确白名单，不得直接关闭审计。
- CI 失败：只修失败 job 相关文件。

## 15. 完成标准

- `reviewed` 项目编辑来源不再进入 `provisionalSourceIds`。
- Capacitor 配置与 `android/` 工程已提交。
- Web 构建产物可同步到 Android。
- 核心排盘和资料库不依赖远程服务。
- 安全区与返回键具备最小正确行为。
- 网络审计可执行并已接入 build 或 CI。
- GitHub CI 已创建并运行，或 PR 创建后等待首次远程运行且未伪称通过。
- 所有必要本地测试真实运行。
- Android 工具链可用时 debug APK 构建成功；不可用时有准确阻塞说明。
- README 和 Android 构建文档更新。
- 实现分支已推送。
- 新 PR 已创建，base 为 `main`。
- PR 描述包含完成项、未完成项、已知问题、实际验证、Android 构建状态、CI 状态。
- 不自行合并 PR。

## 16. Git 收尾

主代理完成后执行：

```text
git status
git add -A
git commit -m "feat: package local app for Android"
git push -u origin feature/r3-mobile-packaging-release
gh pr create --base main --head feature/r3-mobile-packaging-release --title "feat: add R3 Android packaging and release audit" --body-file <prepared-pr-body-file>
```

若 PR 已存在，则更新原 PR，不创建重复 PR。

最终报告仅包括：完成项、未完成项、已知问题、本地验证、Android 构建状态、CI 状态、分支、提交 SHA、PR 链接。
