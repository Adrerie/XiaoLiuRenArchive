# R2 PR #9 审阅修正计划

状态：`READY`

## 1. 本轮目标

只关闭 PR #9 已确认的可审计性问题，不重新审查或改写冻结算法，不拆分为新的实现 PR。

本轮完成：

1. 修正子初 23:00 策略的日期偏移与 trace。
2. 纠正项目自编现代解释的来源归属。
3. 建立知识 manifest 与各知识文件版本的 fail-closed 一致性校验。
4. 更新现有 PR #9 的提交、验证与说明。

默认优先级：

```text
正确结果与可追踪性 > 定向测试 > 必要界面确认 > 简短记录
```

## 2. 分支与工作方式

继续使用现有分支：

```text
feature/r2-calendar-knowledge-expansion
```

先合并最新 `origin/main`，取得本计划。不得创建新的实现分支或新的 PR。

使用单一共享工作区：

- 只有主代理操作 Git。
- 主代理立即处理运行时接线、版本校验、测试和 PR 收尾，不得等待子代理。
- 最多并行使用 `calendar-agent` 与 `knowledge-agent` 两个小任务代理。
- 子代理不得切分支、提交、push、merge 或修改对方路径。
- 失败只追查对应模块，不重置工作区，不扫描整个仓库。

## 3. 主代理持续任务

主代理从开始到结束持续负责：

```text
src/app/**
scripts/**
package.json
README.md
docs/migrations/r2-knowledge-version.md
```

具体任务：

- 将历法适配器返回的真实日期偏移写入最终 `CalendarResolution`。
- 更新结构化详情与 JSON 导出的可复现字段。
- 实现并接入知识版本一致性校验。
- 整合知识来源修改。
- 运行定向验证、提交、push，并更新原 PR #9。

## 4. 修正一：23:00 策略的真实日期偏移

由 `calendar-agent` 负责 `src/calendar/**`，主代理负责 `src/app/**` 接线。

### 4.1 适配器输出

在标准化历法结果中增加真实边界信息，至少包括：

```ts
appliedDayOffset: -1 | 0 | 1
```

规则固定为：

- `civil-midnight-reuse-leap-month`：`0`
- `zi-hour-23-reuse-leap-month` 且本地小时为 `23`：`1`
- `zi-hour-23-reuse-leap-month` 的其他时间：`0`
- `manual-lunar-input-v1`：`0`

不得在应用层根据字符串重新猜测偏移。

### 4.2 结果与 trace

`src/app/divination-runtime.ts` 必须直接消费适配器返回值：

- `boundaryDecision.appliedDayOffset` 写入真实值。
- calendar trace 增加实际 `appliedDayOffset`。
- 23:00 子初策略应能从 trace 看出输入日期与用于农历换算的日期存在一天偏移。
- 民用午夜和手动农历路径仍记录 `0`。
- JSON 导出原样保留这些字段。

同时阻止明显的输入模式与策略错配：

- 手动农历只能使用 `manual-lunar-input-v1`。
- 公历时间不能使用 `manual-lunar-input-v1`。

返回现有结构化历法错误，不静默替换策略。

### 4.3 定向测试

增加：

1. `2024-02-09T23:00`、`Asia/Shanghai`、子初策略得到 `appliedDayOffset: 1`。
2. 同一输入使用民用午夜策略得到 `0`。
3. 运行时 `boundaryDecision` 与 calendar trace 一致。
4. 默认 JSON 导出仍保留真实偏移。
5. 输入模式与策略错配被拒绝。

不扩展全时区或全年份矩阵。

## 5. 修正二：现代解释的真实来源归属

由 `knowledge-agent` 负责知识数据、Schema 与 `src/knowledge/**`，主代理负责 provenance 接线和界面确认。

### 5.1 登记项目自编来源

在 `knowledge/source-registry.json` 中新增一个明确的本地 editorial source，例如：

```text
xiaoliurenarchive-editorial-modern-knowledge-v1
```

其元数据必须说明：

- 发布者为 XiaoLiuRenArchive 项目。
- 支持项目自编的现代中性释义、领域模板、行动提示、现实边界与伦理化改写。
- 不支持传统作者归属、古籍校定、科学有效性或确定预测。
- 内容为本项目人工编写和审阅，不冒充外部传统来源。

来源登记增加独立 `knowledgeVersion`，不得继续把内容版本等同于 `schemaVersion`。

### 5.2 数据级来源绑定

所有项目自编现代内容必须引用 editorial source，而不是复用宫位传统来源：

- `question-domains.v1.json` 的领域及其宫位解释。
- `interpretation-fragments.v1.json` 中项目自编的中性释义、行动、现实核验、阶段修饰、伦理提示与历史语境说明。
- `palaces.v1.json` 中 `modernGeneral` 及其现实核验内容。

必要时扩展对应 Schema，增加明确 `sourceIds` 字段。

传统来源只保留在其真正支持的字段：

- 宫名与报时起课法线索。
- 传统属性候选与原典录文。
- 版本、异文和书目证据。

不得通过代码把 `palace.sourceIds` 自动附加到项目自编现代文本。

### 5.3 运行时与资料库

更新知识加载器与选择器：

- 领域 block、domain action 和 Candidate Claim 使用领域登记的 editorial source。
- 中性现代片段与现实核验使用自身登记来源。
- 传统原文继续使用 `traditionalSourceIds`。
- `getContextSourceIds` 聚合实际使用的现代与传统来源，不虚构字段级支持。
- 资料库现代释义区域能看到项目 editorial source。
- 原典区域仍显示对应外部传统来源。

### 5.4 版本更新

由于来源语义和数据绑定发生变化，递增：

- `bundleVersion`：补丁版本。
- `palacesVersion`。
- `questionDomainsVersion`。
- `interpretationFragmentsVersion`。
- `sourceRegistryVersion`。

`ethicsRulesVersion` 与 `safetyMessagesVersion` 在内容未变时不得无故递增。

更新现有 R2 迁移说明，明确本次改变的是来源追踪，不改变冻结算法和现代文本正文。

### 5.5 定向测试

至少验证：

1. 关系领域现代 block 包含 editorial source。
2. 领域现代 block 不再引用声明“不支持现代问事解释”的教育部词典或网络录文。
3. 传统原文仍引用传统来源。
4. 最终 provenance 同时包含实际显示的现代 editorial source 与传统来源。
5. 小吉 disputed 字段仍被保留。

## 6. 修正三：manifest 版本一致性 fail-closed

主代理负责。

新增轻量本地校验入口，例如：

```text
scripts/validate-knowledge-manifest.mjs
```

校验以下映射完全一致：

```text
manifest.palacesVersion                 == palaces.knowledgeVersion
manifest.questionDomainsVersion         == question-domains.knowledgeVersion
manifest.interpretationFragmentsVersion == interpretation-fragments.knowledgeVersion
manifest.sourceRegistryVersion           == source-registry.knowledgeVersion
manifest.ethicsRulesVersion              == ethics-rules.knowledgeVersion
manifest.safetyMessagesVersion           == safety-messages.knowledgeVersion
```

同时校验 manifest 必需字段为非空字符串，版本不一致时：

- 命令以非零状态退出。
- 输出具体字段、manifest 值与文件值。
- 应用知识加载在发现不一致时抛出 `KNOWLEDGE_INTEGRITY_ERROR`，不得继续生成结果。

增加命令：

```text
npm run validate:knowledge
```

并让正式构建先执行该校验：

```text
npm run build
```

不得引入远程服务，也不得扩展为本轮无关的全量古籍或来源审计。

测试需包含：

- 当前知识包通过。
- 任一模拟版本不一致时失败并指出对应字段。

## 7. 不得回归

必须保持：

- R1 手动农历主流程。
- 两种公历策略 UI 选择。
- 明确拒绝、健康、财务与失联危险守卫。
- 六宫列表、搜索、详情、异文与来源展示。
- 结构化详情。
- 默认移除精确时间的问题安全 JSON 导出。
- 核心落宫算法不变。

## 8. 必要验证

只运行：

```text
npm run validate:knowledge
npm run typecheck
npm run build
npm test
```

关键交互实测：

1. 公历 `2024-02-09 23:00` + `Asia/Shanghai` + 子初策略，结构化详情显示偏移 `1`。
2. 切换民用午夜策略后偏移为 `0`。
3. JSON 导出保留相同偏移与 calendar trace。
4. 资料库打开小吉，现代释义显示项目 editorial source，原典显示传统来源。
5. 普通结果 provenance 同时出现真实现代与传统来源。

只在界面发生可见变化时更新一张代表性截图。不重新跑无关的核心算法枚举或全仓审计。

## 9. Git 与 PR 收尾

完成后：

1. 将所有修改提交到 `feature/r2-calendar-knowledge-expansion`。
2. `git push origin feature/r2-calendar-knowledge-expansion`。
3. 更新现有 PR #9，不创建新 PR。
4. PR 描述必须包含：完成项、未完成项、已知问题、实际运行的测试。
5. 不得自行合并 PR。

## 10. 最终报告

只报告：

- 完成项
- 未完成项
- 已知问题
- 实际测试结果
- 分支、最新提交 SHA 与 PR #9 链接
