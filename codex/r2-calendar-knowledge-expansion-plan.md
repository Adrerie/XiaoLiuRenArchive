# R2 Calendar and Knowledge Expansion 执行计划

状态：`READY`

## 1. 本轮目标

在已完成的 R1 Local Web MVP 上直接推进一次完整更新，不再单独创建零散修补轮次。

本轮同时完成：

1. R1 技术收口：知识版本、规则版本和 provenance（来源追踪）修正。
2. 公历与历法策略增强。
3. 六宫资料库和本地检索。
4. 结构化结果详情与隐私优先 JSON 导出。

默认优先级：

```text
可用功能 > 核心测试 > 必要修正 > 简短记录
```

不得重新论证已冻结算法，不得全仓审计，不得扩写与实现无关的长文档。

## 2. 分支与工作方式

从最新 `main` 创建：

```text
feature/r2-calendar-knowledge-expansion
```

使用单一共享工作区和单一 feature 分支。

- 只有主代理操作 Git。
- 子代理不得切分支、提交、push、merge 或 cherry-pick。
- 主代理持续实现、接线和整合，不得等待全部子代理完成。
- 子代理只读取本计划、自己的任务文件和直接依赖文件。
- 任何冲突只在对应文件中处理，不重置整个工作区。

## 3. 主代理持续任务

主代理从开始到结束持续工作，负责：

- `src/app/**`
- `src/services/**`
- 应用导航与页面接线
- provenance 聚合
- 结构化详情与 JSON 导出
- R2 功能整合
- 最终测试、提交、push 和 PR

子代理运行期间，主代理立即开始第 4 节，不得进入等待状态。

## 4. R1 技术收口

### 4.1 知识包版本

当前领域知识和伦理规则已发生语义修改，不能继续沿用旧版本号。

实现一个明确的本地知识包版本入口，推荐新增：

```text
knowledge/knowledge-manifest.v1.json
```

至少记录：

- bundleVersion
- palacesVersion
- questionDomainsVersion
- interpretationFragmentsVersion
- sourceRegistryVersion
- ethicsRulesVersion
- safetyMessagesVersion

要求：

- `provenance.knowledgeVersion` 使用 bundleVersion。
- `provenance.ruleVersion` 使用 ethicsRulesVersion。
- 修改 `question-domains.v1.json` 的结构化标签后递增对应版本。
- 修改 `ethics-rules.v1.json` 的规则语义后递增对应版本。
- 增加一份不超过一页的迁移说明，记录版本变化和是否改变既有输出。
- 不重新校勘传统原典，不扩大知识内容。

### 4.2 完整 provenance

修正 `sourceIds` 仅从 neutral 区块收集的问题。

最终 `provenance.sourceIds` 必须由以下内容去重聚合：

- 最终实际展示的全部 interpretation sections
- 当前宫位传统文本与宫位登记来源
- 当前使用的领域知识来源
- 当前选择的历史语境或现实核验片段来源

同时：

- `provisionalSourceIds` 只从最终 sourceIds 中计算。
- `fragmentIds` 与最终展示片段一致。
- 当前宫位存在 disputed 字段时写入 `disputedFieldIds`，例如小吉五行异文。
- hard-stop 仍保留必要的算法、历法、知识和规则版本信息。

增加 provenance 定向测试，不重新审查核心算法。

## 5. 公历与历法策略增强

由 `calendar-agent` 负责 `src/calendar/**` 及对应测试，主代理负责 UI 接线。

完成：

1. 公历模式提供明确的历法策略选择：
   - `civil-midnight-reuse-leap-month`
   - `zi-hour-23-reuse-leap-month`
2. 每个策略显示简短说明，并提示切换策略可能改变农历日期与落宫。
3. IANA 时区输入改为本地可搜索选择：
   - 优先使用 `Intl.supportedValuesOf('timeZone')`
   - 不支持时使用小型内置 fallback
   - 不接入远程时区服务
4. 保留 fold 选择和明确错误信息。
5. 结果页继续显示转换后的农历、时辰、策略与 trace。

只增加必要边界测试：

- 稳定公历转换路径
- 23:00 附近两种策略的差异
- 一个夏令时重复时间的 fold 0/1 场景
- 一个不存在本地时间的结构化错误场景

不得扩展为全时区、全年份矩阵测试。

## 6. 六宫资料库

由 `knowledge-agent` 负责 `src/knowledge/**` 的只读选择器和数据接口；由 `frontend-agent` 负责资料库组件；主代理负责导航与接线。

新增移动端优先的主导航：

```text
起课 | 资料库 | 说明
```

本轮不实现完整设置中心。

### 6.1 六宫列表

按传统固定顺序展示六宫，不做吉凶排行。

每张卡至少显示：

- 宫名
- 中性关键词或摘要
- 五行与六神
- provisional / reviewed / disputed 状态
- 是否存在异文

### 6.2 本地搜索

支持在本地搜索：

- 宫名
- 中性关键词
- 传统文本关键词
- 现代解释关键词

不得接入向量数据库、远程搜索或生成式 AI。

### 6.3 六宫详情

详情页或详情面板至少包含：

- 概览
- 原典
- 现代释义
- 问事领域
- 异文
- 来源

要求：

- 原典和现代解释明确分区。
- 网络录文、provisional 和 disputed 状态可见。
- 小吉五行木/水异文必须可见。
- 来源卡显示标题、核验状态、支持范围和外部链接。
- 不新增未经登记的断语。

## 7. 结构化详情与 JSON 导出

主代理负责。

### 7.1 结构化详情

结果页增加可展开的结构化详情，显示：

- algorithmId
- calendarPolicyId
- knowledgeVersion
- ruleVersion
- finalPalaceId
- domainId
- stageId
- fragmentIds
- ethicsRuleIds
- sourceIds
- disputedFieldIds

技术 ID 默认折叠，不占据普通结果的视觉中心。

### 7.2 本地 JSON 导出

提供：

- 复制 JSON
- 下载 `.json`

默认导出策略：

- 不包含问题原文
- `localDateTime` 默认置为 null
- 不增加姓名、性别、性取向或第三方身份字段
- 保留历法策略、计算 trace、知识版本、规则版本和来源

用户可以显式选择“包含精确时间”，但不得默认开启。

导出完全在浏览器本地完成，不上传、不调用远程服务。

增加导出测试：

- 默认精确时间被移除
- 计算与 provenance 保留
- hard-block 与 hard-stop 均可导出
- 导出对象继续符合允许 null 时间的结果 Schema

本轮不做 PNG、长图或 PDF。

## 8. 子代理路径所有权

### calendar-agent

只允许修改：

```text
src/calendar/**
src/calendar/**/*.test.*
```

不得修改 App、知识数据、伦理规则或 Git 状态。

### knowledge-agent

只允许修改：

```text
src/knowledge/**
knowledge/knowledge-manifest.v1.json
knowledge/knowledge-manifest.schema.json
knowledge/question-domains.v1.json
knowledge/ethics-rules.v1.json
docs/migrations/r2-knowledge-version.md
```

负责版本入口、资料库只读接口和必要数据版本递增。不得修改页面组件。

### frontend-agent

只允许修改：

```text
src/components/knowledge/**
src/pages/knowledge/**
src/styles/**
```

负责资料库界面和响应式样式。不得修改历法、核心算法、伦理引擎或 Git 状态。

### 主代理

拥有并持续修改：

```text
src/app/**
src/services/**
src/components/navigation/**
src/pages/about/**
README.md
```

负责 provenance、导出、导航、页面接线和最终整合。

## 9. 执行顺序

1. 主代理确认基线可构建并立即开始版本/provenance 与应用导航。
2. 并行启动 calendar-agent 和 knowledge-agent。
3. 主代理实现结构化详情与 JSON 导出。
4. knowledge-agent 完成稳定接口后，启动 frontend-agent 构建资料库界面。
5. 谁先完成就先接入，不等待所有代理。
6. 运行定向测试并只修复对应模块。
7. 完成移动端和桌面端关键交互实测。
8. 更新 README 当前状态。
9. 提交、push，并创建面向 `main` 的新 PR。

## 10. 必要验证

只运行：

```text
npm run typecheck
npm run build
npm test
```

关键交互实测：

1. 手动农历主流程仍正常。
2. 公历模式可切换两种策略并显示对应 policy ID。
3. 资料库可搜索、打开小吉详情并查看五行异文与来源。
4. 普通结果可打开结构化详情。
5. JSON 默认导出不含精确时间。
6. hard-stop 页面仍以现实行动为首要内容。

截图只保留：

- 桌面端资料库
- 360px 移动端资料库
- 桌面端公历策略或结构化详情

不得重新执行无关的全量来源审计、算法枚举或历史回溯。

## 11. 验收标准

本轮完成时必须满足：

- R1 原有起课闭环无回归。
- 知识包和伦理规则版本真实反映本轮语义变更。
- provenance 覆盖最终展示的全部来源，并显示 disputed 字段。
- 两种公历策略可在 UI 中明确选择。
- 六宫资料库具备列表、搜索、详情、异文和来源展示。
- JSON 导出完全本地运行，默认移除精确时间和问题文本。
- `typecheck`、`build`、`npm test` 通过。
- 新 PR 已推送，PR 描述包含完成项、未完成项、已知问题和实际测试。
- Codex 不得自行合并 PR。

## 12. 明确不做

本轮不做：

- Android / Capacitor
- 账号、云同步和社区
- PDF、PNG、长图导出
- 深色模式和完整设置中心
- 自动简繁转换
- 全量古籍校勘
- 新算法或随机起课法
- 生成式 AI 解释
- 付费功能

## 13. 最终报告

只报告：

- 完成项
- 未完成项
- 已知问题
- 实际运行的测试
- 分支、提交和 PR 链接
