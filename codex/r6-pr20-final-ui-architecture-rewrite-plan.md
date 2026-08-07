# PR #20 最终修补与 UI 架构重写计划

目标分支：`feature/r6-three-palace-archive-responsive-ui`  
目标 PR：`#20`  
目标版本：继续保持 `0.6.0-beta.1` / Android `versionCode 601`  
性质：R6 合并前最终重构，不新增新的实现 PR，不自行合并。

## 0. 总原则

本轮不是在 R6 现有界面上继续追加 CSS，而是保留稳定业务层，重新建立 UI 架构。

执行优先级：

`合并阻塞修正 > UI 架构重写 > 响应式与 Android 系统栏 > 关键测试 > APK 安装交付 > 文档`

必须遵守：

- 保留已经通过审阅的传统算法、三数算法、三宫合同、知识库、伦理规则、Schema、课例册业务能力。
- 旧 UI 实现不作为兼容对象。新组件完成替换后，删除旧组件、旧 class、旧 CSS 和覆盖补丁。
- 不以“最小 diff”为目标，允许主动删除和重写前端展示层。
- 不新增新的起课方法、解释体系、账号、云同步、生成式 AI 或远程网络能力。
- 不修改冻结的 `traditional-month-day-hour-v1`。
- 不重复做 R1–R5 全局审计。
- 失败只排查本轮受影响模块。
- 完成后只更新原 PR #20，不创建重复实现 PR，不自行合并。

## 1. 开始前状态

工作区必须干净。

从远端更新：

- `main` 已包含本计划。
- 继续使用现有 `feature/r6-three-palace-archive-responsive-ui`。
- 将最新 `origin/main` 合入现有 feature 分支，保留 PR #20。
- 不重新从 main 创建另一条 R6/R7 feature 分支。

先阅读且仅阅读关键入口：

- 本计划。
- PR #20 当前 review / CI 失败点。
- `src/app/App.tsx`
- `src/app/entry-form.ts`
- `src/archive/index.ts`
- `src/components/navigation/PrimaryNavigation.tsx`
- `src/styles/index.css`
- `android/app/src/main/java/.../MainActivity.java`
- `knowledge/divination-result.schema.json`
- `docs/09-output-contract.md`

UI 参考只定向查看：

- `Adrerie/NineStarsArchive` 的应用 shell、侧栏、移动导航、横竖屏适配、安全区处理。
- `Adrerie/pvp_type_calculator` 的 design tokens、信息密度、列表/详情、卡片与深浅色结构。

不得对两个参考仓库做无关全仓扫描。

---

# A. 先关闭 PR #20 的合并阻塞

## 2. 当前时间测试必须确定化

当前实现点击或重新点击“当前时间”时，应重新读取：

- 当前设备时间；
- 当前设备 IANA 时区。

这个行为保持不变。

CI 失败来自测试把 `Asia/Shanghai` 写死，而 GitHub runner 的设备时区为 UTC。不得为了让测试通过而让运行时继续沿用旧时区。

修正测试方式：

- 让测试显式注入 / mock 时区检测结果，或把时区检测做成可注入依赖。
- 测试必须同时证明：
  1. 从其他模式切换到当前时间会重新读时钟和时区；
  2. 已经处于当前时间时再次点击仍会刷新；
  3. 其他模式草稿不被覆盖；
  4. 测试结果不依赖 CI runner 所在时区。

不要只把预期值改成 UTC。

## 3. 真正支持 R4 月日时结果迁移

计划要求支持 R4/R5 结果，但当前迁移代码要求旧结果存在顶层 `casting`，真实 R4 `resultVersion: 1.1.0` 没有该字段。

修正原则：

- 为 R4 写真实结构 fixture，不伪造 R6/R5 字段。
- 对 R4 月日时结果，根据旧结果中已经存在且可验证的 `input`、`calendar`、`calculation`、`interpretation`、`provenance` 升级到 R6 合同。
- 可由稳定旧字段确定的内容可以结构化补齐，例如：
  - `algorithmId === traditional-month-day-hour-v1` 对应传统报时方法；
  - `input.inputMode` 决定手动农历或公历时间；
  - `calendarPolicyId`、历法输入和路径来自旧结果本身。
- 不重新占卜，不改变旧 `finalPalaceId`、月/日/时 trace 或原结果语义。
- 缺少无法可靠恢复的字段时使用明确的迁移标记 / `null` / 兼容默认值，只允许合同规定的安全补齐，不猜造用户事实。
- 迁移后必须通过 R6 result schema 与 archive 读取校验。
- 未知未来版本继续 fail-closed。

新增测试：

- 真实 R4 `1.1.0` 月日时结果无顶层 `casting` 也能导入。
- R5 `1.2.0` 月日时可导入。
- R5 三数安全整数可迁移为数字字符串与三宫结构。
- 迁移前后主结果与路径一致。
- 未知版本拒绝且不覆盖已有课例。

## 4. 课例导入严格 fail-closed

修复：

- `primaryPalaceOrdinal` 只接受合同允许值。
- 传统路径必须为 `null`；三宫路径必须为 `3`。
- 任意其他值不得被静默强制转换成 `3`。
- `path`、`primaryPalaceId`、`result.calculation` 三者必须互相一致。
- 三宫记录要求第三宫 == primary palace。
- 传统记录要求时宫 == primary palace。

## 5. 本地存储不可用时不得假装持久化

当前 localStorage 不可用时退回内存存储，会导致用户看到“已保存”，但应用重启后记录消失。

改为显式能力状态：

- 持久化存储可用：课例册正常保存。
- 持久化存储不可用：起课仍可使用，但课例册保存按钮禁用或保存时明确失败。
- 文案明确“当前环境无法使用持久本地存储”。
- 不把 session memory 描述为“已保存到本地课例册”。
- 导入、标题修改、删除、清空都遵守同一能力状态。

## 6. hard-stop 展示边界

`hard_stop` 时不能继续把三宫、trace、导出和保存课例作为正常结果内容直接铺开。

重组为：

1. 安全 / 现实行动首屏。
2. 必要的受控说明。
3. 一个默认关闭的 disclosure：`查看传统计算与技术记录`。
4. disclosure 内才允许出现：
   - 历法换算；
   - 月日时 / 三宫路径；
   - trace；
   - structured result；
   - 导出；
   - 课例保存。

要求：

- 主结果 Hero、关系解释、普通领域解释在 hard-stop 时不作为正常主内容显示。
- disclosure 标明这些记录“不作为当前现实行动依据”。
- 不改变 calculation 本身。

## 7. Android Back 顺序

覆盖层优先于页面切换：

1. 先关闭 modal / sheet / more menu / detail overlay。
2. 再关闭 structured disclosure（若实现为受控 overlay）。
3. 非起课页面再返回起课页。
4. 起课页无覆盖层时才交回系统默认返回行为。

不能出现“More 菜单带着一起返回起课页”的残留状态。

---

# B. UI 架构彻底重写

## 8. 目标

R6 当前完成了应用结构，但仍有明显的旧 UI 覆盖式演进：旧选择器、旧卡片、旧 `.app-shell` / `.primary-navigation` / `.mode-option` 等规则与 R6 新规则叠加。

本轮目标不是视觉微调，而是：

> 稳定业务层不动，展示层重新搭建；旧 UI 被替换后直接删除。

完成后不得再存在“旧 CSS + 文件末尾 R6 覆盖层”的结构。

## 9. 新组件边界

将 `App.tsx` 收缩为：

- 顶层业务状态组装；
- 页面选择；
- Android back / native appearance 同步；
- archive store / theme 等应用级 provider 或 controller。

不得继续在单个 `App.tsx` 内定义完整表单和完整结果页。

建议至少拆为：

```text
src/app/
  App.tsx
  AppShell.tsx
  app-controller / hooks（按现有项目复杂度决定）

src/pages/casting/
  CastingPage.tsx
  CastingMethodSelector.tsx
  CurrentTimePanel.tsx
  SpecifiedTimePanel.tsx
  ManualLunarPanel.tsx
  ThreeNumberPanel.tsx
  QuestionContextPanel.tsx

src/pages/result/
  ResultView.tsx
  ResultHero.tsx
  ThreePalaceFlow.tsx
  CalendarPath.tsx
  InterpretationSummary.tsx
  RealitySection.tsx
  TechnicalDisclosure.tsx

src/components/navigation/
  DesktopSidebar.tsx
  MobileTopBar.tsx
  MobileBottomNav.tsx
  MoreSheet.tsx
```

已有 archive / methods / knowledge 页面按需拆分，不为了目录漂亮做无意义组件化。

## 10. CSS / design system 重建

不继续在 `src/styles/index.css` 尾部追加第三套覆盖。

重建为单一来源，例如：

```text
src/styles/
  tokens.css
  reset.css
  shell.css
  controls.css
  pages.css
  responsive.css
  themes.css
```

可以按项目实际规模合并文件，但必须满足：

- token 只有一个来源；
- shell 只有一套规则；
- safe-area 只有一套规则；
- 同一组件不存在历史与新两套基础定义；
- media query 可以覆盖布局，但不靠重复复制整套组件规则；
- 禁止 `!important` 补洞；
- 删除不再使用的 class 和 selectors；
- 删除旧 radio 专属样式等已经失效的规则；
- 颜色、边框、surface、文字色必须尽量 token 化。

UI 重写完成后做一次 legacy CSS audit，主动删除未使用和重复 selector。

## 11. 视觉方向

保持 XiaoLiuRenArchive 自己的视觉身份：

- 米白 / 墨绿 / 纸本感；
- 安静、克制；
- 不照搬 NineStars 的颜色；
- 不照搬 PVP 的紫蓝视觉；
- 不做过量毛玻璃；
- 不做满屏阴影和圆角卡片。

设计原则：

- 通过排版、留白、线条和层级区分信息，而不是所有内容都装进独立卡片。
- 大面积内容区域允许无边框 section。
- 卡片只用于真正需要独立边界或交互的元素。
- 主结果和三宫路径形成产品辨识度。

## 12. App chrome

删除目前过大的 landing-page Header 感。

桌面 / 平板横屏：

- 品牌进入应用 shell；
- 左侧 sidebar 作为稳定导航锚点；
- sidebar 可以有紧凑 / 收缩状态，按实现复杂度决定是否本轮实现；
- 主内容页自己拥有 page title，不重复巨大品牌标题。

手机：

- 顶部只保留轻量 `小六壬档案` + 必要操作；
- 不在每次进入起课页显示巨大 H1、长 lede、离线 badge、文字主题按钮组合；
- 底部导航固定且避让 safe-bottom。

主题切换：

- 不用一个长期占空间的“大文字循环按钮”。
- 使用小型图标按钮或放入“更多 / 外观”。
- 必须有 accessible label 和当前状态。

## 13. 导航

桌面 / 大平板：

- Sidebar：起课、课例册、六宫资料、方法说明、关于。
- 统一小型图标系统，可使用本地 inline SVG，不依赖远程资源。
- 当前页面状态明确，但避免大块高饱和背景。

手机竖屏：

- Bottom nav：起课、课例、六宫、更多。
- “更多”使用 sheet / popover，包含方法说明、关于、外观。
- 不能只用一块浮动 div 模拟菜单后缺乏 focus 管理。

手机横屏：

- 根据高度切换为紧凑侧栏 / rail；
- 不保留占高度的 bottom nav；
- 页面内容尽量立即进入输入/结果区域。

## 14. 起课页重新设计

### 14.1 起课方式

手机不再使用横向滚动卡片。

手机竖屏优先采用 2×2 紧凑 method selector：

```text
当前时间    指定时间
手动农历    三数起课
```

或者等价的不滚动紧凑方案。

桌面和平板可变为一行 / 2×2，按实际空间适配。

选中状态用背景、文字、图标和 aria-pressed 共同表达，不只依赖颜色。

### 14.2 当前时间

当前时间模式默认只显示：

- 大号时间；
- 日期；
- 时区；
- 时区异常提示（仅异常时）。

再次点击“当前时间”入口即刷新，不再永久显示一长段操作说明。

时区 / fold / 历法策略进入“高级设置”。

### 14.3 三数法

主表单只显示三个数字输入和简短的一句取数说明。

完整方法说明移到：

- 信息按钮；
- 方法说明页；
- 或折叠帮助。

不要把长段教学文字永久占据起课主路径。

### 14.4 问事领域和安全事实

- 领域 / 阶段作为清楚但次一级的上下文输入。
- 稀有安全 flags 不要和常规核心输入争夺首屏视觉权重；可以使用“需要说明的现实情况”折叠区域。
- 伦理计算逻辑保持不变。

## 15. 结果页重新设计：减少 UI

结果页不得继续堆叠十余张同权重 `result-section` 卡片。

固定视觉层级：

### Level 1：主结果

- 宫名为视觉主体。
- 当前领域最重要的一条解释与主结果一起出现。
- 关系领域可以把“当前关系状态”作为主摘要之一。
- 不在 Hero 中堆大量 badge / 技术标签。

### Level 2：路径与核心解释

- 三数：`ThreePalaceFlow`。
- 传统：月宫 → 日宫 → 时宫路径。
- 中性象意 / 当前领域 / 阶段提示合并为更自然的信息区域，不必每块一个卡片。
- 现实核验和可执行行动作为独立但清晰的内容组。

### Level 3：技术与来源

默认折叠到一个或少量 disclosure：

- 历法换算；
- 完整 trace；
- 传统原典；
- 历史语境；
- provenance；
- structured JSON；
- 导出。

普通用户不需要在主结果滚动路径上连续经过算法、Schema 和来源卡片。

## 16. 三宫成为核心视觉组件

三宫不能只是三张普通卡片。

目标是一个稳定的流程视觉：

```text
速喜 ───── 大安 ───── 小吉
 ①          ②           ③
起始        发展        当前主判
```

要求：

- 第三宫明显是主判，但不只靠颜色区分。
- 连接线 / 节点结构能体现连续起数。
- 手机 390px 宽度下默认不横向滚动。
- 大整数原始输入不要撑破主视觉；只显示短摘要，完整数字放技术详情。
- 可选点击 / 展开单宫基础象意，但不强制本轮实现复杂动画。
- 尊重 `prefers-reduced-motion`。

## 17. 课例册界面

桌面 / 平板横屏：

- list-detail 双栏。

手机竖屏：

- 默认只显示课例列表；
- 点击课例进入详情视图 / sheet / 页面级 detail；
- 不把长详情直接堆在列表下面造成一整页无限滚动。

课例操作：

- 导入 / 导出 / 清空放在次级工具区域。
- 删除动作有明确危险态。
- 标题编辑不占用主要信息宽度。
- 存储不可用时显示清楚的能力状态。

## 18. 六宫资料与方法说明

不做功能扩张，只让其进入统一 UI 体系：

- 与 AppShell 一致的 page header。
- 桌面可使用 list-detail 或合理网格。
- 手机详情避免密集卡片堆叠。
- 技术 ID 默认折叠。

---

# C. 响应式与 Android 系统 UI

## 19. 响应式目标状态

至少针对以下形态真正设计，不只依赖缩放：

1. 390×844 手机竖屏。
2. 844×390 手机横屏。
3. 768×1024 平板竖屏。
4. 1024×768 平板横屏。
5. 1440×900 桌面。

要求：

- 不出现页面级水平滚动。
- method selector 不依赖水平滚动。
- 三宫主视觉不依赖水平滚动。
- 横屏手机压缩 header / helper / 空白。
- 平板横屏有效使用左右空间。
- 平板竖屏不是放大的手机，也不是缩小的桌面。

## 20. Android edge-to-edge 与 safe area

继续使用明确的 edge-to-edge：

- WebView 延伸到系统栏区域。
- 背景可以延伸。
- 交互内容自行避让 inset。

统一：

- safe-top；
- safe-bottom；
- safe-left / safe-right；
- mobile bottom nav；
- mobile top bar；
- more sheet；
- detail overlay；
- sticky / fixed actions；
- landscape cutout；
- IME。

不要给整个应用重复叠加两层安全区 padding。

## 21. Android 系统栏主题必须跟随“应用实际主题”

当前 MainActivity 只读取 Android 系统的 night mode，因此在“系统浅色 + App 手动深色”等情况下，状态栏 / 导航栏图标可能与应用主题不一致。

建立单一同步机制：

- `system`：跟随 Android 系统主题。
- `light`：明确使用适合浅色背景的系统栏图标。
- `dark`：明确使用适合深色背景的系统栏图标。

可以实现一个极小的 native bridge / Capacitor plugin / 已有可用能力，但必须：

- 不访问网络；
- 不为了系统栏引入大型依赖；
- JS theme preference 变化时同步 native system bars；
- App 首次启动和 configuration change 后保持一致；
- Android 原生层与 CSS theme 使用同一语义，不各自猜测。

## 22. 深色模式清理

全面移除深色模式下会失去对比度的硬编码文字 / surface 色。

重点检查：

- checkbox row；
- ethics banner；
- helper / muted text；
- input / select；
- buttons；
- selected nav；
- three-palace flow；
- archive detail；
- danger state；
- source links。

颜色进入 token，至少保证主要文字和交互控件在浅 / 深主题下均可读。

---

# D. 测试和验收

## 23. 单元与合同测试

必须通过：

- version validation；
- knowledge validation；
- network audit；
- Android manifest audit；
- typecheck；
- build；
- application tests；
- core algorithm tests；
- ethics tests。

新增 / 修正测试重点：

- 当前时间重复点击和时区检测确定性。
- R4/R5 migration。
- archive path invariant。
- storage unavailable 行为。
- hard-stop display contract 可测试的纯逻辑部分。
- 三宫主判 invariant。

不得因为 UI 重写修改传统算法期望。

## 24. UI smoke

只做有限关键交互：

- 当前时间重复点击刷新。
- 四种起课方式切换且草稿保留。
- 3/5/5 → 速喜 → 大安 → 小吉。
- 保存课例、查看、改标题、删除。
- 手机 More 打开/关闭。
- Android back 覆盖层优先关闭。
- light / dark / system 主题切换。
- hard-stop 不直接铺出占断结果。

## 25. 截图回归

生成少量固定截图：

浅色：

- `start-390x844`
- `start-844x390`
- `result-390x844`
- `result-768x1024`
- `result-1024x768`
- `result-1440x900`
- `archive-390x844`
- `archive-1440x900`

深色只补关键两张：

- `result-dark-390x844`
- `result-dark-1440x900`

不要为每个断点、每个页面批量制造截图。

截图验收关注：

- 无旧版大 Hero 残留；
- 无卡片汤；
- 无水平溢出；
- 三宫是视觉主体；
- 手机首屏直接进入任务；
- 平板与桌面空间利用合理；
- 深色文字可读。

## 26. Android 交付边界

最后：

1. `mobile:sync`
2. 构建 debug APK。
3. 若仅有一台已授权 ADB 设备，使用 `adb install -r` 安装。
4. 安装后立即停止自动操作。
5. 不自动启动应用。
6. 不继续跑冷启动黑屏诊断。
7. 等待用户从桌面图标主动打开并反馈顶部、底部、横竖屏和实际业务交互。

---

# E. 清理与交付

## 27. Legacy UI 删除验收

完成新 UI 后必须删除：

- 被新组件替代的旧组件实现。
- 无引用 class。
- 同一组件的旧基础 CSS。
- 已失效 radio 样式。
- 只为了覆盖旧样式而存在的后置 selector。
- 重复 safe-area 规则。
- 重复 theme surface 定义。

禁止留下“先不删，后面再说”的明显死代码。

运行一次有限的静态搜索确认：

- 旧 class 无 JSX 引用；
- 新 class 无重复历史定义；
- 无新增 `!important`。

不做第三方大型 CSS 审计工具接入。

## 28. 文档

更新必要文档：

- R6 migration / UI architecture 说明。
- `docs/09-output-contract.md` 更新到当前结果合同，补三数 / 三宫 / nullable calendar / method provenance / relationshipCurrentState。
- Android 手动测试文档补系统主题覆盖组合。
- README 只更新用户可见能力，不写长篇开发过程。

## 29. Git / PR

继续更新：

- branch：`feature/r6-three-palace-archive-responsive-ui`
- PR：`#20`

不得创建新的 R6/R7 实现 PR。

完成后：

- commit；
- push；
- 更新 PR #20 描述，准确写明 UI 已进行架构重写、旧 UI 已删除；
- 不自行 merge。

最终报告只包含：

- 完成项；
- 未完成项；
- 已知问题；
- CI / 核心验证；
- 截图路径；
- APK 路径与安装状态；
- branch；
- head SHA；
- PR URL。
