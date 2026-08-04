# Batch 03 Implementation Gate

Status: `SUPERSEDED-BY-BATCH-04`

本文件保留用于记录 Batch 03 的历史门槛。最新实现要求以以下文件为准：

- `codex/batch-04-implementation-plan.md`
- `codex/batch-04-acceptance-criteria.md`
- `codex/tasks/*.md`
- `algorithm/interpretation-engine-contract.md`
- `algorithm/ethics-engine-contract.md`
- `knowledge/divination-request.schema.json`
- `knowledge/question-context.schema.json`
- `fixtures/interpretation-golden-cases.v1.json`
- `fixtures/ethics-red-team-cases.v1.json`

Batch 03 的原则仍然有效，但 Batch 04 已补齐输入合同、规则语义、冲突案例、产品范围、黄金样例和红队样例。

## 1. Batch 03 已完成的基础

- 架构、算法和历法规范
- 六宫、领域、片段和伦理知识
- 来源登记和异文政策
- 输出 Schema
- 验证清单
- 子代理总体编排

## 2. Batch 04 新增要求

在创建工程代码前，总控代理还必须：

1. 阅读 request 和 question context Schema。
2. 阅读解释与伦理引擎合同。
3. 阅读规则冲突案例。
4. 阅读产品需求和 UI 信息架构。
5. 实际创建并使用任务书中的七个强制子代理。
6. 将黄金样例、伦理红队样例和受控安全文案纳入验证。
7. 对照 Batch 04 acceptance criteria，而不是仅完成最小页面。

## 3. 仍然禁止抢跑

在知识校验、核心算法、规则引擎和 fixture 测试通过前，不得优先开发：

- 动画与复杂视觉
- Android 发布
- PDF 或长图导出
- 历史记录与云同步
- 用户账号
- 分享社区
- 付费功能
- AI 解读
- 现代流派扩展

## 4. 当前行动

总控代理应停止继续扩写规划，直接执行 `codex/batch-04-implementation-plan.md`，并以 `codex/batch-04-acceptance-criteria.md` 作为 R1 合并门槛。
