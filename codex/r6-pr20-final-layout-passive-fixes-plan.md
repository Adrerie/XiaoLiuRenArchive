# R6 PR #20 Final Layout & Passive Fixes Plan

## 目标

本轮是 PR #20 合并前最后一轮定向收口，不新增起课方法、不新增知识内容、不改传统冻结算法、不扩张产品范围。

重点只处理最新 UI 重构后仍会被动暴露的问题，并完成桌面 Web 构图收口。

当前时间自动刷新是当前产品决定，保留现状：页面保持在“当前时间”模式时可以自动刷新，点击“当前时间”也可立即读取。不得在本轮恢复为“只点击才更新”。

继续使用现有实现分支与 PR：

- branch: `feature/r6-three-palace-archive-responsive-ui`
- PR: `#20`

不得创建新的实现 PR，不得自行合并 PR #20。

---

## 1. 前置同步

开始前将最新 `main` 合入现有 R6 分支。

`main` 已单独加入 AGPL-3.0-only LICENSE、README 许可说明与 `package.json` license 字段。合并时必须保留：

- R6 版本 `0.6.0-beta.1`；
- `license: AGPL-3.0-only`；
- 完整 LICENSE；
- README 的 R6 状态和许可说明。

若 README / package 产生冲突，只解决对应文件，不做全局回退。

---

## 2. Web 桌面端重新构图

当前代码组件拆分已经完成，但桌面视觉仍保留旧 landing-page 构图：大品牌 Header + 起课/空结果永久双栏。

本轮必须改视觉骨架，不只调 margin / max-width。

### 2.1 App chrome

桌面品牌以 sidebar 为主要锚点。

删除或显著压缩当前 `desktop-header` 的 landing-page 感：

- 不再在主内容顶部长期展示巨大“小六壬档案” H1；
- 不保留长 lede 占据首屏；
- 离线状态与主题入口改为紧凑 utility 区；
- 页面自身显示紧凑 page title，如“起课”“课例册”“六宫资料”。

sidebar 保留 sticky 行为，不改回 fixed，不遮挡内容。

### 2.2 Shell 宽度

不要让整个 App 像居中的网页卡片漂在大屏中间。

- sidebar + app content 使用 viewport 宽度；
- 只对具体业务内容设置合理 `max-width`；
- 1440 / 1920 宽屏都应充分利用空间；
- 不产生页面级横向滚动。

### 2.3 起课前 / 起课后两种布局状态

不要无条件永久显示 50/50 “输入 + 巨大空结果”。

起课前：

- 起课表单是主内容；
- 不渲染或不占据大型空结果 column；
- 可以保留轻量的方法摘要 / 最近课例 / 本地运行说明作为次级区域，但不能用一张 300px+ 空白结果卡占据半屏。

起课后：

- 再进入双栏结果布局；
- 输入侧宽度降低，结果侧成为主视觉；
- 结果长页面时 sidebar 继续可见；
- “清除结果”恢复起课前布局并保留输入草稿。

建议通过明确状态 class / data attribute 实现，例如 `data-has-result`，不要用零散 CSS selector 猜状态。

---

## 3. Android / 横屏 safe-area 补齐

当前原生已启用 edge-to-edge，但 Web token 只有 top/bottom。

新增单一来源：

- `--safe-left: env(safe-area-inset-left, 0px)`
- `--safe-right: env(safe-area-inset-right, 0px)`

并应用到真正需要避让的区域：

- 手机横屏 compact rail / sidebar；
- mobile topbar；
- main content；
- MoreSheet / fullscreen detail；
- 底部导航必要的左右 padding。

不得给整个页面重复叠加多套 inset。

重点确保 `844×390` 横屏时左右切口、圆角或系统手势区域不会覆盖导航和输入控件。

---

## 4. 手机课例册真正 list → detail

桌面 / 平板横屏继续 list-detail 双栏。

手机竖屏：

- 默认只显示课例列表；
- 点击课例后进入独立 detail 状态，而不是把详情追加在列表下方；
- detail 提供明确返回列表动作；
- Android Back 在课例 detail 中先返回列表，再返回起课页；
- 删除当前记录后能安全回到剩余列表 / 空状态；
- 导入、导出、清空仍放次级工具区。

避免为了这一项引入完整路由库；使用现有页面状态即可。

---

## 5. MoreSheet 完整 modal 行为

当前 MoreSheet 只有 `role=dialog`，需补齐实际 modal 行为：

- 打开后将焦点移入 sheet；
- Tab / Shift+Tab 焦点限制在 sheet 内；
- Escape 关闭；
- 点击 backdrop 关闭；
- 关闭后焦点恢复到“更多”触发按钮；
- Android Back 优先关闭 sheet；
- 打开期间避免背景被键盘继续操作。

不得引入重量级 modal 依赖，仅实现当前组件所需行为。

---

## 6. 结果保存状态不得串课

`archiveStatus` 必须绑定当前结果生命周期。

修复：

- 每次开始生成新结果时清空上一课的 `archiveStatus`；
- 清除结果时继续清空；
- 生成失败也不能留下旧“已保存”提示；
- 保存当前结果后才显示成功状态。

新增针对“保存 A → 修改输入 → 直接生成 B”的回归测试，B 不得继承 A 的保存提示。

---

## 7. 普通结果保存入口移出技术详情

normal / allow / 非 hard-stop 结果：

- “保存到课例册”是普通用户动作，不得藏在“计算路径、来源与导出工具” disclosure 内；
- 将保存入口放在结果主路径的次级操作区，例如主结果 / 现实核验之后；
- 保存状态在同一区域反馈；
- structured JSON、trace、export、provenance 继续留在技术 disclosure。

hard-stop：

- 维持当前安全边界；
- 保存与导出仍只能位于默认关闭的技术记录 disclosure 内；
- 不把传统结果重新提升为主内容。

---

## 8. 主题必须能回到“跟随系统”

当前状态支持 `system | light | dark`，但 UI 点击后只剩 light/dark 循环。

补一个明确可访问的三态入口：

- 跟随系统；
- 浅色；
- 深色。

可以放在 MoreSheet / 外观区域，桌面保留紧凑主题按钮作为快捷切换，但用户必须始终能恢复 `system`。

要求：

- Web `data-theme` 与 native ThemeBar 同步；
- system 模式继续响应 OS theme change；
- 当前选择有可访问状态说明；
- 不增加新的主题。

---

## 9. 课例导入 batch ID 严格校验

导入必须同时检查：

1. 与现有课例 ID 冲突；
2. 同一个待导入文件内部 ID 重复。

任一冲突：

- 整批导入失败；
- 不部分写入；
- 不自动改 ID；
- 给出明确错误。

继续保持未知未来版本 fail-closed。

新增最小测试覆盖内部重复 ID 和事务性不写入。

---

## 10. “清除结果”不是危险删除

“清除结果”只清当前显示状态，不删除课例或本地数据。

- 去掉 danger destructive styling；
- 使用普通 secondary / quiet action；
- 文案可继续使用“清除结果”或更轻的“重新起课”，但行为必须保留输入草稿。

真正删除课例、清空课例册继续使用 danger style。

---

## 11. 明确不修改

本轮不得修改：

- 六宫顺序；
- 月、日、时冻结算法；
- 三数算法与 3/5/5 基准；
- 三宫第三宫主判合同；
- 关系解释知识内容；
- R4/R5 迁移语义；
- 当前时间自动时钟行为；
- AGPL 许可文本；
- 账号、云同步、AI、随机起数等未规划功能。

不要顺手继续扩张六宫资料库内容。

---

## 12. 验证

执行优先，不做长审计。

必要验证：

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. Web 关键视觉 smoke：
   - 1440×900 起课前；
   - 1440×900 起课后；
   - 390×844 手机起课；
   - 390×844 课例 list → detail；
   - 844×390 横屏，无水平溢出且左右 safe-area 正常。
5. MoreSheet 键盘：打开、Tab、Shift+Tab、Escape、焦点恢复。
6. 主题三态最小 smoke。
7. archiveStatus 串课与重复 ID 自动测试。

Android：

- `npm run mobile:sync`
- 构建 debug APK；
- 若仅有一台已授权 ADB 设备，使用 `adb install -r` 覆盖安装；
- 安装后停止，不主动启动应用，不跑 connected cold-start 自动测试；
- 等待用户从设备上主动测试。

已通过且本轮未触及的核心算法测试不反复运行。

---

## 13. 交付

继续更新原 PR #20。

完成后：

- commit；
- push `feature/r6-three-palace-archive-responsive-ui`；
- 更新 PR #20 描述中的完成项 / 验证 / 已知项；
- 不创建新实现 PR；
- 不自行合并。

最终报告只保留：

- 完成项；
- 未完成项；
- 已知问题；
- 验证结果；
- 关键 Web 截图路径；
- APK 路径与安装状态；
- branch / head SHA / PR URL。
