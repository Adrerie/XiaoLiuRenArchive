# R5 Entry, Localization and Casting Method Plan

状态：EXECUTION-FIRST · USER-REPORTED REGRESSION FIX · IMPLEMENTATION REQUIRED

R4 已合并，但用户实际使用后确认四个问题：

1. Web 首次打开仍使用写死的测试日期与 `Asia/Shanghai`，没有读取当前设备时间与时区。
2. “当前阶段”直接显示 `seeking`、`new_acquaintance` 等内部 ID，中英文混杂。
3. 页面只有月、日、时这一类报时起课入口，没有独立的非时间取数方式。
4. Android 测试 APK 从桌面图标冷启动后持续黑屏。既有 instrumentation smoke 直接启动 Activity，不能代替真实 launcher cold start。

本轮优先级：

```text
Web 默认入口与当前时间 > 阶段中文化 > 三数起课 > Android 冷启动自查与修复 > 文档
```

Android 黑屏必须由主代理在完成前三项后独立自查，不得反过来阻塞 Web 修补。最终仍使用一个实现分支和一个 PR。

## 1. 本轮目标

1. 页面首次打开时默认选择“当前时间起课”，自动填入设备当前本地时间与 IANA 时区。
2. 起课方式在同一张卡片中无缝切换，不打开新页面、不刷新、不闪白、不清空问事上下文。
3. 将普通界面中的领域阶段全部显示为自然中文，内部 ID 只保留在结构化详情和导出中。
4. 增加一个明确标注为现代变通法的“三数起课”，不得冒充传统报时起课法。
5. 保持传统月、日、时算法、固定测试向量和伦理过滤不变。
6. 从 launcher 冷启动真实 APK，定位并修复 Android 持续黑屏。
7. 发布 `0.5.0-beta.1` 测试 APK，更新 README 和 PR 报告，不自行合并。

## 2. 本轮不做

- 不加入姓名笔画、汉字笔画、扑克牌、方位、外应、单数或任意数量随机数等未经整理的起课变体。
- 不加入远程服务、生成式 AI、账号、云同步、广告、遥测或崩溃上报。
- 不改写六宫传统文本、现代领域解释和伦理规则。
- 不把三数起课的三个数字伪装成农历月、日、时辰。
- 不让不同起课方式共享含义错误的 `calendar` 字段。
- 不重新审查 R1–R4 已通过的知识内容与核心伦理合同。
- 不建立独立入口页或多路由向导。

## 3. Git 与调度

实现分支：

```text
feature/r5-entry-localization-number-method
```

只有主代理操作 Git、依赖、版本、Schema、CI、Android、提交、推送和 PR。

允许最多两个窄子代理：

- `web-entry-agent`：只处理当前时间初始化、起课方式切换、阶段中文标签和对应 Web 测试。
- `number-method-agent`：只处理三数算法包装器、类型、Schema 和核心测试。

主代理从开始起负责公共类型、运行时接线、结果展示、Android 冷启动、版本、CI 和最终整合，不等待子代理结束。

## 4. 启动阅读范围

主代理只读取：

1. `README.md`
2. `codex/execution-first-policy.md`
3. 本计划
4. `package.json`
5. `src/app/App.tsx`
6. `src/app/divination-runtime.ts`
7. `src/shared/types/divination.ts`
8. `src/calendar/**` 中直接依赖
9. `algorithm/core/**` 与直接测试
10. `knowledge/question-domains.v1.json`
11. `src/knowledge/index.ts` 中 domain/stage 解析部分
12. 当前结果 Schema 与导出测试
13. `capacitor.config.ts`
14. `android/app/src/main/AndroidManifest.xml`
15. `android/app/src/main/res/values/styles.xml`
16. `android/app/src/main/java/**/MainActivity.java`
17. `scripts/run-android-device-test.mjs`
18. `.github/workflows/ci.yml`

不得先全仓扫描或生成长审计报告。

## 5. Work Package A：默认当前时间入口

### 5.1 初始方式

普通页面首次渲染时默认起课方式必须为：

```text
current_civil_time
```

界面文案：

```text
当前时间
使用此设备当前日期、时间与时区
```

不得继续使用：

```text
2024-02-10T12:00
Asia/Shanghai
```

### 5.2 运行时初始化

将静态 `INITIAL_FORM` 改为惰性初始化函数，例如：

```text
createInitialForm(now, detectedTimeZone)
```

要求：

- 使用 `new Date()` 读取设备当前时间。
- 生成 `datetime-local` 所需的本地 `YYYY-MM-DDTHH:mm`，不得用 `toISOString()` 后截取，否则会错误转成 UTC。
- 使用 `Intl.DateTimeFormat().resolvedOptions().timeZone` 读取 IANA 时区。
- 时区为空、异常或不在本地支持列表时回退 `UTC`，并显示可见提示。
- 不请求地理位置权限，不通过 IP 推断位置。
- 首次加载只初始化一次，不每分钟覆盖用户输入。
- 提供“使用当前时间”按钮，用户主动点击时才重新读取当前时间与时区。
- 页面 hydration/StrictMode 双执行不得导致时间字段跳动。

### 5.3 起课方式入口

将现有“手动农历 / 公历时间”二选一改为统一“起课方式”选择器，至少包含：

1. `current_civil_time`：当前时间，默认选中。
2. `specified_civil_time`：指定公历时间。
3. `manual_lunar_time`：手动农历与时辰。
4. `three_number_variant`：三数起课（现代变通法）。

要求：

- 入口在“开始一课”卡片顶部直接可见。
- 首屏已经选中“当前时间”，并直接显示已填好的当前时间内容。
- 切换方式只替换卡片内部的输入区域，不改变主路由，不整页刷新。
- 使用轻量 CSS 过渡；遵守 `prefers-reduced-motion`，不做复杂动画。
- 切换后把焦点移到新方式的第一个有效控件，但不得抢走首次页面加载焦点。
- 问事领域、阶段、安全事实与已有结果区不因切换方式丢失。
- 每种方式保留自己的草稿。用户从三数方式切回指定时间时，之前修改的时间仍在。
- “当前时间”切到其他方式再返回时不自动覆盖原值；只有点击“使用当前时间”才刷新。
- 不显示技术方法 ID 作为主文案。技术 ID 可放在折叠说明或结构化详情中。

## 6. Work Package B：阶段中文化

当前阶段 ID 是稳定机器合同，不得改名。新增面向界面的中文标签层。

建议在 `question-domains.v1.json` 中为每个 domain 增加与 `stages` 一一对应的结构，例如：

```json
"stageOptions": [
  { "id": "seeking", "label": "寻找关系" },
  { "id": "new_acquaintance", "label": "初识" }
]
```

也可采用等价、可校验的 `stageLabels` 映射，但不得把标签散落硬编码在 `App.tsx`。

要求：

- 每个 stage ID 必须有且只有一个非空中文标签。
- 标签映射必须由知识加载器失败闭合校验。
- 保留 `stageId` 供规则匹配、结构化详情与 JSON 导出。
- 普通下拉框只显示中文标签，不显示 `seeking` 等 ID。
- “不指定阶段”继续存在。
- 领域切换时默认阶段使用该领域第一个 stage ID，但显示其中文标签。
- 关系领域至少使用：
  - `seeking` → `寻找关系`
  - `new_acquaintance` → `初识`
  - `ambiguous` → `暧昧或关系未明`
  - `dating` → `约会与交往`
  - `committed` → `稳定承诺关系`
  - `separated` → `已经分开`
  - `reconciliation` → `考虑复合`
- 其他领域使用简洁、自然、面向普通用户的中文，不照搬蛇形命名。
- bump `questionDomainsVersion` 与 bundle version，增加短迁移记录；已有 stage ID 和 fragment ID 不变。
- README、About 和普通结果区不得再出现未解释的 stage/domain 技术 ID。

## 7. Work Package C：三数起课（现代变通法）

### 7.1 语义边界

传统核心继续标记为：

```text
传统月日时报时起课
traditional-month-day-hour-v1
```

新增方法必须标记为：

```text
三数起课（现代变通法）
three-number-sequential-count-v1
FROZEN-PROVISIONAL
```

界面说明：

- 用户依次输入三个正整数。
- 三个数字按六宫固定顺序连续起数。
- 这是对月、日、时三段连续起数结构的现代取数变体，不等同于传统报时法。
- 不宣称随机数字更准确，不鼓励对同一问题反复起课。

### 7.2 输入与算法

新增独立输入类型，例如：

```text
ThreeNumberInput {
  kind: "three_numbers"
  first: number
  second: number
  third: number
}
```

仅接受正整数。不得接受空值、NaN、小数、0 或负数。

计算：

```text
firstIndex  = positiveMod(first - 1, 6)
secondIndex = positiveMod(firstIndex + second - 1, 6)
thirdIndex  = positiveMod(secondIndex + third - 1, 6)
```

要求：

- 复用六宫顺序和底层安全取模工具，但使用独立算法包装器与独立算法 ID。
- 不把 `first/second/third` 写入 `lunarMonth/lunarDay/earthlyBranchIndex`。
- trace 阶段使用 `first_number / second_number / third_number` 或等价明确命名。
- 结果页面显示“三数第一步、第二步、第三步”，不得显示“月宫、日宫、时宫”。
- 月日时报时算法文件与原黄金向量不得被改写。
- 三数 `3, 5, 5` 必须得到三步 `速喜 → 大安 → 小吉`，最终小吉。
- 大整数通过取模安全处理，不进行长循环。
- 问事领域、阶段、现实事实和伦理过滤继续在落宫之后工作，不能进入数字计算。

### 7.3 结果结构

不得强迫非时间起课产生虚假的 `CalendarResult`。将结果输入来源改成明确的判别联合，例如：

```text
casting.kind = "calendar" | "three_numbers"
```

或等价结构。

要求：

- calendar 起课继续提供完整历法、边界和 timezone trace。
- three-number 起课提供三个原始数、规范化余数、算法 ID 与三步 trace。
- calendar 区块在三数方式下不渲染；改为“取数输入”区块。
- 导出 Schema 能区分两种输入，禁止伪造 null calendar 字段来掩盖语义。
- 默认隐私合同不变，不加入问题原文。
- bump request/result/export schema 的必要版本，并更新迁移说明。
- provenance 增加该方法的本地编辑来源或方法登记来源，状态为 provisional/reviewed 中真实的一种；不得引用教育部词典来证明现代三数公式。

## 8. Work Package D：界面语言收口

普通用户界面统一使用中文。下列英文只允许作为小型辅助 kicker 或折叠技术信息，不得成为用户必须理解的内容：

- `CALENDAR INPUT`
- `fold`
- `seeking`
- 算法 ID
- calendar policy ID
- fragment ID

具体要求：

- `fold（歧义时必选）` 改为 `重复时间选择`，选项改为 `自动 / 较早一次 / 较晚一次`；在说明中解释夏令时回拨。
- 方法策略下拉普通文本使用中文，ID 只在辅助 code 中显示。
- 删除“当前 smoke 路径使用 2024-02-10...”测试文案。
- 页面标题“开始一课”保留。
- 当前方式的简短说明随方式无缝切换。
- 结果页针对起课方式使用正确术语，不把三数起课称为历法转换。

## 9. Work Package E：Android 冷启动黑屏自查

前三个 Web work package 完成并测试后，主代理再处理本项。

既有 `ActivityScenario.launch()` smoke 不足以验证用户从桌面图标打开应用。必须新增真实 launcher cold-start 流程：

1. 安装最新 debug APK。
2. `adb shell am force-stop io.github.adrerie.xiaoliurenarchive`。
3. 清空应用相关 logcat。
4. 通过 MAIN/LAUNCHER intent 启动，不通过 instrumentation 直接构造 Activity。
5. 使用 `am start -W` 或等价命令记录启动状态和耗时。
6. 在 1 秒、3 秒、10 秒检查窗口、WebView、`document.readyState` 与 `#root` 子节点。
7. 截取冷启动画面和应用范围 logcat。

自查顺序只限启动链：

- APK 中是否存在 `assets/public/index.html`、JS、CSS 和知识 JSON。
- `index.html` 的 JS/CSS 是否全部为相对 URL。
- Capacitor `webDir` 与 `mobile:sync` 产物是否一致。
- launcher theme、splash theme 和 post-splash theme 是否正确切换。
- MainActivity/Bridge 是否报告页面加载或插件初始化错误。
- WebView console 是否存在未捕获 JavaScript 异常。
- 运行时是否因 `Intl.supportedValuesOf`、timezone 或知识初始化异常在 render 前崩溃。

要求：

- 找到根因后只修改直接相关模块。
- 增加 launcher cold-start 自动测试，确认 10 秒内出现 `#root` 内容和“开始一课”。
- 测试必须先 force-stop，不能复用已被 instrumentation 预热的进程。
- 启动失败时保留截图、logcat、WebView console 和 `am start -W` 输出。
- 不把“Gradle 构建成功”或“ActivityScenario 成功”写成冷启动修复成功。
- 若同一 TB710FU 可用，必须在该实体设备重新安装并从桌面/launcher 冷启动验证。

## 10. 版本与状态

本轮新增输入方法和结果合同，版本统一升级为：

```text
app version: 0.5.0-beta.1
Android versionName: 0.5.0-beta.1
Android versionCode: 501
build channel: beta-debug
```

更新版本校验脚本、About 页与 README。

README 必须：

- 标记 R4 已完成并合并。
- 当前阶段改为 R5。
- 说明默认当前时间、中文阶段、三数现代变通法和 Android 冷启动验证。
- 不再显示“R4 正在实施”。

## 11. 必要测试

### 11.1 Web 与单元测试

必须覆盖：

- 固定假时间 `2026-08-06 22:44` 与 `Asia/Shanghai` 初始化为 `2026-08-06T22:44`。
- 不使用 UTC 截断造成日期或小时偏移。
- 时区检测失败时回退 UTC 并显示提示。
- 首次方式为“当前时间”。
- “使用当前时间”刷新，普通重渲染不覆盖用户修改。
- 四种方式无路由刷新切换，分别保留草稿。
- 切换方式保留领域、阶段和安全事实。
- 普通阶段下拉不出现 raw stage ID。
- 每个 stage ID 都存在中文标签，缺失时知识校验失败。
- 三数 `3,5,5` 最终小吉，trace 正确。
- 0、负数、小数与空值失败闭合。
- 三数结果不包含伪造 calendar 数据。
- 月日时黄金测试和身份独立性测试不回归。
- hard-block/hard-stop 在三数方式下继续有效。
- JSON 导出符合新 Schema 且默认隐私字段不变。

### 11.2 必要命令

```text
npm run validate:version
npm run validate:knowledge
npm run audit:network
npm run typecheck
npm run build
npm test
npm run test:core
npm run test:ethics
npm run mobile:sync
npm run mobile:build:debug
```

### 11.3 浏览器 smoke

只做代表性 smoke：

1. 初次打开显示当前设备时间与时区。
2. 当前时间 → 指定时间 → 手动农历 → 三数方式无缝切换，草稿不丢失。
3. 关系阶段下拉显示中文。
4. 三数 `3,5,5` 得小吉。
5. 传统公历时间起课仍可复现。

保留桌面和窄屏各一张截图即可。

### 11.4 Android smoke

- launcher cold start，不使用预热 Activity。
- 首屏 10 秒内显示“开始一课”。
- 默认时间与时区存在。
- 三数 `3,5,5` 得小吉。
- 不出现持续黑屏、FATAL EXCEPTION、主资源加载失败或未捕获 JS 初始化错误。

## 12. 实施顺序

1. 主代理建立起课方式 UI 状态与惰性当前时间初始化。
2. 完成中文阶段数据、校验和界面接线。
3. 完成三数独立算法、结果联合类型、Schema 和结果展示。
4. 完成 Web 测试、浏览器 smoke 和版本更新。
5. 再执行 Android launcher cold-start 自查，定位并修复黑屏。
6. 运行必要测试与实体设备 smoke。
7. 更新 README、构建文档和 PR 描述。
8. 提交、推送并创建 R5 PR，不自行合并。

## 13. PR 与交付

提交建议拆为不超过三个逻辑提交：

```text
feat: default to local current-time casting
feat: localize stages and add three-number casting
fix: restore Android launcher cold start
```

推送分支：

```text
git push -u origin feature/r5-entry-localization-number-method
```

创建面向 `main` 的单一 PR。PR 描述只包含：

- 完成项
- 未完成项
- 已知问题
- 实际运行命令与结果
- 浏览器截图
- Android 冷启动设备、结果、截图与 logcat 路径
- APK artifact 名称与保留期
- 分支和 head SHA

不得自行合并。

## 14. 完成判定

以下条件全部满足才可报告完成：

- Web 首次打开默认当前时间，不再显示固定 2024 测试时间。
- IANA 时区来自本机，失败时明确回退 UTC。
- 四个起课入口在同一卡片无缝切换并保留草稿。
- 普通阶段 UI 全中文，无 raw stage ID。
- 三数方法具有独立输入、算法 ID、trace、Schema 和 provenance。
- 三数方法明确标注现代变通法，不冒充传统报时法。
- 传统月日时算法与黄金向量无回归。
- Android 真实 launcher cold start 不再持续黑屏。
- 最新 Web 与 Android CI 通过。
- `0.5.0-beta.1` APK artifact 可下载。
- PR 描述完整，未自行合并。
