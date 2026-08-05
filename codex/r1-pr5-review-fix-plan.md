# R1 PR #5 Review Fix Plan

Status: `TARGETED-FIX`

本计划只修复 PR #5 的已确认问题。不得重新设计架构、重写核心算法、全仓扫描或重复已经通过的核心枚举测试。

## 1. 工作区

- 保持在 `feature/r1-local-web-mvp`。
- 不重置工作区，不新建第二个实现分支。
- 只有主代理执行 Git 操作。
- 主代理直接完成整合修正，不等待新一轮多代理调研。

## 2. 修复伦理展示闭环

修改应用服务、运行时和结果页面，使伦理结果真正约束最终展示。

必须满足：

- `blockedFragmentIds` 对应片段不进入最终展示 sections。
- 被抑制 claim 对应的危险文本不继续显示。
- `retainedFragmentIds` 与最终展示片段一致。
- `hard_block` 保留安全提示、允许内容、计算结果和来源信息。
- `hard_stop` 隐藏主要占断解释，只保留现实行动、安全提示、必要输入和计算 trace。
- 伦理处理不得修改 `finalPalaceId`。

优先在应用服务形成最终可展示结果，页面不自行重新实现伦理规则。

## 3. 修复输出 Schema

使最终 `DivinationResult` 符合：

`knowledge/divination-result.schema.json`

处理当前未声明字段：

- `interpretation.candidateClaims`
- `interpretation.selectedFragments`
- `ethics.controlledMessages`

内部引擎可保留运行时中间结构，但对外结果必须按 Schema 序列化。不要为了迁就当前实现随意放宽 Schema。

增加一条实际结果 Schema 测试，至少覆盖：

- 普通手动农历结果
- 一个 `hard_block` 结果
- 一个 `hard_stop` 结果

## 4. 接入公历入口

底层 `fromGregorian` 已存在。本轮只增加最小可操作 UI：

- 手动农历 / 公历时间两种输入模式切换
- 本地日期时间
- IANA 时区
- 必要的 fold 选择或明确错误提示
- 转换后的农历月、日、时辰与策略在结果中可见

只实测一条稳定公历转换路径，不扩展所有 DST 边界。

## 5. 删除未使用双轨实现

删除当前 Web 工程未使用的：

- `knowledge/__init__.py`
- `knowledge/loader.py`

不得保留 TypeScript 与 Python 两套知识组装实现。

## 6. 必要测试

只运行：

```text
npm run build
npm run test:ethics
与 runtime、service、Schema 直接相关的测试
手动农历 smoke test
公历输入 smoke test
hard-block 与 hard-stop 页面实测
```

核心算法代码未修改时，不重复运行 4320 组枚举。出现失败只修对应模块。

更新移动端和桌面端代表性截图，截图至少包含一个伦理受限结果或公历输入状态。

## 7. PR 收尾

完成后：

1. 提交全部修改。
2. 推送 `feature/r1-local-web-mvp`。
3. 更新现有 PR #5，不新建重复实现 PR。
4. 更新 PR 描述，写明完成项、未完成项、已知问题和实际运行的测试。
5. 报告 PR #5 链接、最新提交 SHA 和截图路径。

不得自行合并 PR #5。
