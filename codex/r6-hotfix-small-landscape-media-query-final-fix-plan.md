# R6 hotfix 小屏横屏媒体查询最终修补计划

## 目标

本轮只修复 PR #22 中剩余的一个媒体查询叠加问题，不扩范围，不重做 UI，不修改已经通过的两个核心补丁。

继续使用现有分支与 PR：

- branch: `hotfix/r6-tablet-back-safe-area`
- PR: `#22`

不得创建新 PR，不得自行合并。

---

## 1. 问题

当前 `src/styles/responsive.css` 中：

- `@media (max-width: 760px)` 定义手机 UI：隐藏 desktop sidebar、显示 mobile topbar / bottom navigation，并让主内容同时承担 `safe-left` 与 `safe-right`；
- 后方 `@media (max-height: 520px) and (orientation: landscape)` 定义横屏 rail：重新显示/配置 desktop sidebar，隐藏 mobile bottom navigation，并将主内容左侧 safe-area 移交给 rail。

当设备同时满足 `width <= 760px` 且 `height <= 520px` 的横屏条件时，两组规则会一起命中。由于 landscape 规则在后方，它会覆盖 mobile 规则的一部分，造成：

- mobile bottom navigation 被隐藏；
- desktop sidebar 仍可能保持被 mobile 规则隐藏；
- `.app-content` 左侧 `safe-left` 被覆盖为普通固定 padding；
- 小屏横屏可能出现导航入口缺失与 cutout/safe-area 侵入。

这是 PR #22 唯一剩余的合并前问题。

---

## 2. 修复要求

将 rail 专用横屏媒体查询限定为非 compact 宽度。

优先采用：

```css
@media (min-width: 761px) and (max-height: 520px) and (orientation: landscape) {
  ...
}
```

要求：

- `<=760px` 的横屏手机只走 mobile UI；
- mobile topbar / bottom navigation 保持可用；
- mobile `.app-content` 保持左右双侧 safe-area；
- `844×390` 等 `>760px` 的矮横屏设备继续走 compact rail；
- rail 继续承担 `safe-left`；
- rail 场景主内容继续只承担 `safe-right`；
- 不改 760px compact archive 判定；
- 不改 Android Back 状态逻辑；
- 不改 sidebar/rail 宽度方案；
- 不新增其他 breakpoint。

若发现该条件与现有 CSS cascade 存在等价但更清晰的最小修法，可以采用，但必须保持上述行为。

---

## 3. 明确禁止修改

本轮不得修改：

- 起课算法；
- 三数算法；
- 当前时间自动刷新；
- 课例 compact 状态逻辑；
- Android Back 逻辑；
- 主题；
- MoreSheet；
- 知识库；
- archive schema / migration；
- LICENSE；
- package version / Android versionCode；
- 其他 Web 桌面布局。

不得顺手做 CSS 重构或视觉优化。

---

## 4. 验证

只做定向验证：

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. Web smoke：
   - `740×390`：应走 mobile UI，sidebar 不出现，bottom navigation 可见，左右 safe-area 保留，无横向溢出；
   - `390×740`：手机竖屏无回归；
   - `844×390`：继续走 rail，bottom navigation 隐藏，rail 可见，safe-left 由 rail 承担，主内容 safe-right 正常；
   - `800×1280`：平板双栏课例 Back 修复无回归。

若当前浏览器 harness 无法模拟真实 env safe-area，可至少检查对应 computed style / CSS rule 命中关系，并确认 740×390 不再命中 rail media query。

Android：本轮仅 CSS 条件修复。若已有上一轮 APK 安装证据，无需重复实体设备安装；若 Codex 本地流程自动重新构建，可构建 debug APK，但不要主动启动、不要跑 cold-start/connected test。

---

## 5. 交付

完成后：

- commit；
- push `hotfix/r6-tablet-back-safe-area`；
- 更新 PR #22 描述或追加简短说明，注明“小屏横屏媒体查询叠加已关闭”；
- 不创建新 PR；
- 不自行合并。

最终报告只需：

- 修改文件；
- 740×390 / 844×390 验证结果；
- typecheck/test/build 结果；
- head SHA；
- PR #22 URL。
