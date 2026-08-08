# R6 Tablet Back & Safe-Area Hotfix Plan

## 目标

本轮只修复 R6 合入 `main` 后确认保留的两个边界问题，不扩功能，不重构已通过模块。

工作分支：

`hotfix/r6-tablet-back-safe-area`

目标分支：

`main`

完成后新建一个小型 hotfix PR 到 `main`，不得直接推送 `main`，不得自行合并。

当前时间自动刷新是当前产品决定，本轮不得修改。

---

## 1. 修复平板课例 Android Back 的“隐形状态”

### 现状

当前 `ArchivePage` 点击任意课例时会无条件执行：

- 选择该课例；
- `mobileDetailOpen = true`。

但真正的移动端 list → detail CSS 只在 `max-width: 760px` 生效。

因此约 800dp 的 Android 平板竖屏仍显示桌面/平板双栏，却会在内部留下 `mobileDetailOpen = true`。此时 Android Back 第一次只清除这个不可见状态，视觉上没有任何变化；第二次 Back 才返回起课页。

### 要求

将“是否处于移动课例详情模式”变成显式 viewport 状态，不能仅依赖 CSS 隐式判断。

推荐实现：

1. 在 `App` 层维护一个与 CSS breakpoint 一致的 compact archive detail 状态，例如基于：

   `window.matchMedia("(max-width: 760px)")`

2. 该状态需要：
   - 首次挂载时读取；
   - viewport / orientation 变化时更新；
   - 从 compact 变为非 compact 时主动清除 `archiveDetailOpen`，避免旋转后残留隐藏状态。

3. 将 compact 状态传入 `ArchivePage`。

4. 点击课例时：
   - 始终更新 `selectedId`；
   - 只有当前确实处于 compact list → detail 模式时，才将 `mobileDetailOpen` 设为 `true`；
   - 平板/桌面双栏点击课例只更新右侧详情，不产生移动详情状态。

5. Android Back：
   - MoreSheet / 技术详情等已有优先级保持不变；
   - 只有 `view === "archive"`、当前 viewport 确实处于 compact 模式、且 `archiveDetailOpen === true` 时，Back 才先返回课例列表；
   - 平板/桌面双栏下不得消费一次无视觉变化的 Back；应直接按既有层级返回起课页。

6. 不引入路由库，不重新设计课例册 UI。

### 验收场景

- 390×844：点击课例 → 进入详情 → Back 返回列表 → 再 Back 返回起课。
- 800px 左右平板竖屏：点击课例只更新右侧详情 → Back 一次直接返回起课，不出现“第一次没反应”。
- compact 详情打开后旋转/扩宽到 >760px：移动详情状态自动清除，双栏恢复正常。

---

## 2. 修复横屏 safe-area 左右重复/错侧分配

### 现状

当前有 sidebar / rail 的布局中：

- sidebar 同时使用 `safe-left` 和 `safe-right`；
- main content 同时使用 `safe-left` 和 `safe-right`。

这会造成方向分配错误。例如横屏设备只有右侧 cutout 时，`safe-right` 仍会挤压左侧 72px rail；左侧 inset 也可能在 rail 与 main 之间被重复消费。

### 原则

有 sidebar / rail 时，安全区必须按物理方向分工：

- 左侧 sidebar / rail 负责 `safe-left`；
- 右侧 main content 负责 `safe-right`；
- main content 不重复消费 `safe-left`；
- sidebar 不消费 `safe-right`。

无 sidebar 的手机布局中，topbar / main content / bottom navigation / MoreSheet 才同时承担左右 inset。

### 具体修改

检查并定向修改：

- `src/styles/shell.css`
- `src/styles/responsive.css`
- 必要时 `tokens.css`，但现有 `--safe-left/right` token 不重复定义。

基础桌面：

- `.desktop-sidebar`：左 padding 使用 `safe-left`，右 padding 为普通固定值，不加 `safe-right`。
- `.app-content`：右 padding 使用 `safe-right`，左 padding不再叠加 `safe-left`。

为了避免 cutout 挤压 compact rail 的有效宽度，允许将 sidebar grid column 的基础宽度写成 `base width + safe-left`，使 inset 占用额外空间而不是压缩导航 glyph。例如 compact rail 可采用等价于：

`calc(72px + var(--safe-left))`

同时 sidebar 内部左 padding继续包含 `safe-left`，右 padding保持固定，从而维持原本可用内容宽度。

逐一检查这些 breakpoint：

- 默认桌面 sidebar；
- `max-width: 1120px`；
- `max-width: 900px` portrait compact rail；
- `max-height: 520px` landscape compact rail。

手机 `max-width: 760px`：

- sidebar 已隐藏；
- `mobile-topbar`、`.app-content`、`.mobile-bottom-navigation` 继续同时使用 `safe-left/right`；
- MoreSheet 继续同时使用左右 inset；
- 不要因本轮修改破坏手机布局。

### 验收

- 844×390 横屏无页面级横向滚动。
- compact rail 内导航 glyph 不因 opposite-side inset 被压缩。
- CSS 中有 rail 时不再出现 sidebar 消费 `safe-right`、main 重复消费 `safe-left` 的组合。
- 390×844 手机布局保持原样，无回归。

---

## 3. 明确不修改

本轮禁止顺手修改：

- 当前时间自动时钟；
- 四种起课方式；
- 月日时冻结算法；
- 三数算法与 3/5/5 基准；
- 三宫合同与第三宫主判；
- 关系解释、伦理内容与知识库；
- R4/R5 迁移；
- 主题系统；
- MoreSheet；
- Web 桌面总体构图；
- LICENSE / README 许可内容；
- 版本号与 Android versionCode。

除非上述两个补丁直接导致编译或测试失败，否则不要扩大修改范围。

---

## 4. 验证

执行优先，只做受影响区域验证。

必要：

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. Web smoke：
   - 390×844 课例 list → detail；
   - >760px 平板宽度课例双栏；
   - 844×390 横屏 rail；
   - 390×844 手机无横向溢出。
5. 验证 viewport 从 <=760 → >760 后 `archiveDetailOpen` 不残留。
6. 若测试基础设施适合，补一个针对 compact/non-compact Back 条件的最小自动测试；不要为了测试引入新的 UI 测试框架。

Android：

1. `npm run mobile:sync`
2. 构建 debug APK。
3. 若恰有一台已授权 ADB 设备，使用 `adb install -r` 覆盖安装。
4. 安装后停止，不主动启动应用，不执行自动 cold-start / connected test。
5. 等待用户手动验证：
   - 平板课例双栏下 Back 一次返回起课；
   - 手机/窄窗口课例详情 Back 先回列表；
   - 横屏 rail 与系统边缘无明显侵入。

已经通过且未触及的核心算法、伦理、知识专项测试不重复扩展。

---

## 5. Git 与交付

完成后：

1. commit 到 `hotfix/r6-tablet-back-safe-area`；
2. push 该分支；
3. 创建一个新的 hotfix PR 到 `main`；
4. PR 标题建议：`R6 hotfix: tablet archive back and safe-area allocation`；
5. PR 描述只写：完成项、验证、已知问题、APK 安装状态；
6. 不自行合并。

最终报告保持简短，只包含：

- 两个问题是否完成；
- 验证结果；
- Android APK / 安装状态；
- branch；
- head SHA；
- PR URL。
