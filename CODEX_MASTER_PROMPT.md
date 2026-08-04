# Codex Master Prompt

你是 XiaoLiuRenArchive 的总控开发代理。你的任务不是重新设计术数体系，而是依据仓库中的知识规范、算法合同、产品要求与伦理规则，构建一个完全本地运行、可审计、可测试的小六壬专家系统应用。

Batch 04 是最后一批实现交接规范。读取完本提示词后，应进入工程实现，不要继续无限扩写规划文档。

## 一、开始工作前

必须按顺序阅读：

1. `README.md`
2. `AGENTS.md`
3. `docs/00-project-charter.md`
4. `docs/01-system-architecture.md`
5. `docs/02-algorithm-spec.md`
6. `docs/03-calendar-policy.md`
7. `docs/04-knowledge-model.md`
8. `docs/06-modern-ethics.md`
9. `docs/08-testing-standard.md`
10. `docs/09-output-contract.md`
11. `docs/10-product-requirements.md`
12. `docs/11-ui-information-architecture.md`
13. `algorithm/contract.md`
14. `algorithm/interpretation-engine-contract.md`
15. `algorithm/ethics-engine-contract.md`
16. `algorithm/test-vectors.v1.json`
17. `algorithm/rule-conflict-examples.v1.json`
18. `knowledge/divination-request.schema.json`
19. `knowledge/question-context.schema.json`
20. `knowledge/divination-result.schema.json`
21. `knowledge/source-registry.json`
22. `knowledge/palaces.v1.json`
23. `knowledge/question-domains.v1.json`
24. `knowledge/interpretation-fragments.v1.json`
25. `knowledge/ethics-rules.v1.json`
26. `knowledge/calendar-policies.v1.json`
27. `knowledge/safety-messages.v1.json`
28. `fixtures/interpretation-golden-cases.v1.json`
29. `fixtures/ethics-red-team-cases.v1.json`
30. `scripts/validation-manifest.json`
31. `codex/orchestration.md`
32. `codex/batch-04-implementation-plan.md`
33. `codex/batch-04-acceptance-criteria.md`
34. 每个子代理对应的 `codex/tasks/*.md`

若文件之间存在冲突，不得自行选择。先记录冲突，优先遵循 `AGENTS.md`、冻结算法合同、规则引擎合同和人工批准的 ADR，并在工作报告中提出。

## 二、必须使用子代理

本项目规模较大，禁止由单个代理一次性完成。总控代理必须实际创建并使用以下专职子代理：

- `architecture-agent`
- `calendar-agent`
- `core-algorithm-agent`
- `knowledge-agent`
- `ethics-agent`
- `frontend-agent`
- `test-audit-agent`

可根据需要增加：

- `interpretation-agent`
- `data-validation-agent`
- `accessibility-agent`
- `export-agent`
- `release-agent`

每个子代理必须在独立 branch 或 worktree 工作，并按其任务书提交报告。总控代理不得象征性创建子代理后自行完成全部工作。

## 三、推荐工程方向

优先沿用本地优先技术方向，但不要复制 NineStarsArchive 的原创排盘算法：

- React
- TypeScript strict
- Vite
- Vitest
- 本地 JSON 知识库
- 支持 JSON Schema Draft 2020-12 的校验器
- `lunar-javascript` 或经批准的等价本地历法库
- 基础 CI
- 后续可选 Capacitor Android

不得接入 Gemini、OpenAI 或其他生成式模型 API。不得将用户问题发送到远程断语、分析、分类或日志服务。

## 四、冻结传统算法

核心起课输入仅为规范化后的：

- 农历月
- 农历日
- 十二时辰序号

六宫顺序：

```text
0 大安 da_an
1 留连 liu_lian
2 速喜 su_xi
3 赤口 chi_kou
4 小吉 xiao_ji
5 空亡 kong_wang
```

计算：

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

必须返回逐步 trace。身份、问题内容、领域、随机数、系统时间和网络状态不得进入核心计算。

## 五、输入与历法

所有请求必须通过：

- `knowledge/divination-request.schema.json`
- `knowledge/question-context.schema.json`

输入支持：

- 手动农历
- 公历本地日期时间加 IANA 时区

历法代理必须处理：

- 用户时区
- 公历到农历转换
- 闰月标识
- 十二时辰映射
- 民用午夜与 23:00 子初换日策略
- 夏令时歧义和不存在时间
- 超出历法库范围

第一版默认策略必须来自本地 policy registry，并在 UI 与结果中显示 `calendarPolicyId`。手动农历路径必须先完成，且不依赖公历转换库。

## 六、双规则引擎

### Interpretation Rule Engine

必须严格遵循 `algorithm/interpretation-engine-contract.md`：

1. 前置校验
2. 六宫中性片段
3. 领域解释
4. 阶段修正
5. 行动提示
6. 历史语境
7. Candidate Claims
8. 伦理求值
9. 现实证据优先
10. 固定顺序组装

正式解释只能从本地登记内容组合，不允许自由补写断语。

### Ethics Rule Engine

必须严格遵循 `algorithm/ethics-engine-contract.md`：

- 按优先级和 ID 稳定排序
- 评估结构化条件
- 执行受控 effect
- 合并 severity
- 抑制 claim
- 阻止片段
- 使用受控结论与现实行动代码
- 返回完整 trace

伦理层不能修改落宫。未知条件、effect 或无法解决的规则冲突必须 fail closed。

## 七、知识与来源

应用必须分开显示：

1. 计算结果
2. 传统原文或传统属性
3. 现代释义
4. 问事领域解释
5. 阶段修正
6. 风险与伦理提示
7. 来源与版本信息

每次结果必须能追溯到：

- `algorithmId`
- `calendarPolicyId`
- `knowledgeVersion`
- `palaceId`
- `domainId`
- `stageId`
- `fragmentIds`
- `ethicsRuleIds`
- `sourceIds`

网络录文不得自动升级为校定原典。传统异文不得静默合并。

## 八、关系与性别伦理

同性恋、双性恋、无性恋、跨性别与非二元用户均按正常亲密关系解释。

禁止：

- 把同性伴侣强制分成夫位与妻位
- 根据攻受、表达方式、外貌或气质分配阴阳
- 推断第三方性取向、性别身份、出柜状态或性行为角色
- 认为同性关系缺少所谓阴阳配合
- 把生育当作关系成功的必要条件
- 用吉宫推翻对方已经表达的拒绝

身份字段只可用于用户主动选择的称谓，必须在进入核心算法前剥离。

## 九、高风险领域

健康、法律、金融、生死、失踪、暴力、怀孕、犯罪指控、超自然归因与未成年人问题必须经过伦理规则引擎。

伦理规则引擎可以：

- 添加边界说明
- 降低确定性措辞
- 引导现实核验
- 阻止不允许的结论
- 在紧急场景中停止以占断为主要行动

不得：

- 修改落宫
- 伪造更吉利结果
- 生成医疗诊断或风险排除
- 给出投资买卖与收益保证
- 保证法律结果
- 预测死亡时间和寿命
- 指控具体人员犯罪
- 强化鬼神、诅咒等现实因果

## 十、产品范围

第一轮按 `docs/10-product-requirements.md` 与 `docs/11-ui-information-architecture.md` 实现。

必须完成：

- 手动农历输入
- 一套公历转换路径
- 历法策略选择
- 领域与阶段选择
- 现实事实确认
- 隐私选项
- 请求复核
- 结果总览
- 完整 trace
- 现代解释
- 原典、异文与来源
- hard-stop banner
- provenance drawer
- 六宫资料库基础页

不要优先开发动画、账号、云同步、社区、付费、Android 发布和完整 PDF 导出。

## 十一、验证与测试

必须实现并实际运行：

```text
validate:schemas
validate:references
audit:text
validate:fixtures
test:core
test:ethics
test:fixtures
test
build
audit:network
```

必须覆盖：

- 传统三月初五辰时小吉案例
- 12 × 30 × 12 数学枚举
- 逐步算法与压缩公式等价
- 六宫周期
- 身份不影响落宫
- 历法边界
- 全部 JSON Schema
- 全部跨文件引用
- 黄金样例
- 伦理红队样例
- 规则冲突样例
- 第三方身份阻止
- 明确拒绝优先
- 医疗、财务、法律和失踪安全规则
- 落宫在伦理前后不变

任何测试失败时不得修改预期来迎合实现。未运行的测试不得声称通过。

## 十二、Git 工作流

建议分支：

```text
feature/project-shell
feature/knowledge-validation
feature/calendar-engine
feature/core-divination
feature/interpretation-engine
feature/ethics-engine
feature/frontend
feature/testing-audit
integration/r1-mvp
```

总控代理负责整合，`test-audit-agent` 必须独立审阅整合分支。

每个 PR 必须说明：

- 范围
- 子代理分工
- 设计决策
- 是否影响算法
- 来源变化
- 测试命令与结果
- 已知问题
- UI 截图，仅限 UI 变更

## 十三、第一轮完成标准

必须逐项对照 `codex/batch-04-acceptance-criteria.md`。以下任一失败都会阻止 R1：

- 核心算法错误
- 知识引用错误
- 伦理 hard-block 或 hard-stop 失败
- 黄金或红队样例失败
- 身份影响落宫
- 问题文本被上传
- 结果不符合 Schema
- 构建失败
- 未经独立审计

## 十四、完成报告

结束时输出：

- 实际创建的子代理
- 分支与 worktree
- 各代理文件和职责
- 共享合同变化
- 命令与退出结果
- 算法测试摘要
- 历法测试摘要
- 知识校验摘要
- 黄金样例摘要
- 伦理红队摘要
- 网络与隐私审计
- UI 截图
- 尚未核验的异文
- 下一轮建议

不得声称未实际运行的命令已经通过。
