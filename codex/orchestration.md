# Codex 子代理编排规范

Version: `1.1.0`

## 1. 总则

本项目必须由总控代理协调多个专职子代理完成。禁止单个代理在同一工作区中同时设计历法、修改核心算法、撰写知识库、构建界面并自行宣称审计通过。

Batch 04 后，所有强制子代理均有独立任务书，位于 `codex/tasks/`。总控代理必须实际创建并使用这些子代理，不能仅在报告中列名。

总控代理负责：

- 读取全部规范
- 创建任务图
- 建立独立 branch 或 worktree
- 冻结共享接口
- 分配文件所有权
- 收集子代理报告
- 组织整合
- 处理冲突
- 请求独立审计
- 对照验收标准形成完成报告

总控代理不得绕过人工决定未解决的传统异文。

## 2. 强制子代理与任务书

| 子代理 | 任务书 | 核心所有权 |
|---|---|---|
| `architecture-agent` | `codex/tasks/architecture-agent.md` | 工程骨架、共享类型、应用服务、CI |
| `calendar-agent` | `codex/tasks/calendar-agent.md` | 历法适配、时区、策略、转换错误 |
| `core-algorithm-agent` | `codex/tasks/core-algorithm-agent.md` | 冻结起课纯函数与 trace |
| `knowledge-agent` | `codex/tasks/knowledge-agent.md` | Schema、引用校验、知识加载、解释前半段 |
| `ethics-agent` | `codex/tasks/ethics-agent.md` | 伦理规则求值与安全输出 |
| `frontend-agent` | `codex/tasks/frontend-agent.md` | 输入、结果、来源、无障碍 UI |
| `test-audit-agent` | `codex/tasks/test-audit-agent.md` | 独立测试与合并审计 |

可选子代理：

- `interpretation-agent`，当解释引擎工作量需要从 knowledge-agent 分离时
- `data-validation-agent`，独立实现或复核知识验证
- `accessibility-agent`
- `export-agent`
- `release-agent`

## 3. 工作区纪律

推荐每个代理使用独立 worktree：

```text
../xlr-project-shell
../xlr-knowledge-validation
../xlr-calendar
../xlr-core
../xlr-interpretation
../xlr-ethics
../xlr-frontend
../xlr-audit
```

推荐分支：

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

禁止多个代理在未声明所有权时同时修改同一文件。

## 4. 共享接口冻结

`architecture-agent` 必须在并行实现前建立并发布以下接口：

- `DivinationRequest`
- `QuestionContext`
- `NormalizedLunarInput`
- `CalculationResult`
- `CandidateClaim`
- `InterpretationDraft`
- `EthicsEvaluationResult`
- `DivinationResult`
- typed error union

共享接口一旦冻结，breaking change 必须：

1. 由提出代理写出原因
2. 标出所有依赖代理
3. 更新对应 Schema 或合同
4. 由总控代理批准
5. 通知所有工作区
6. 由 test-audit-agent 检查兼容性

## 5. 文件所有权

| 区域 | 主代理 | 审阅代理 |
|---|---|---|
| `src/shared/**`, `src/types/**`, configs | architecture | test-audit |
| `src/calendar/**` | calendar | test-audit |
| `src/core/**` | core-algorithm | test-audit |
| `src/knowledge/**`, `scripts/**` | knowledge | test-audit/data-validation |
| `src/interpretation/**` | knowledge/interpretation | ethics + test-audit |
| `src/ethics/**` | ethics | test-audit |
| `src/components/**`, `src/pages/**` | frontend | accessibility/test-audit |
| `tests/audit/**` | test-audit | controller |
| `knowledge/**` | knowledge | controller + test-audit |
| `algorithm/**` foundation contracts | human-controlled | no agent may change casually |

前端代理不得修改核心算法。算法代理不得为了 UI 便利改变返回语义。

## 6. 建议任务图

```text
architecture-agent
   ├── shared contracts ──────────────────────────────┐
   ├── calendar-agent ────────────────────────────────┤
   ├── core-algorithm-agent ──────────────────────────┤
   ├── knowledge-agent ── interpretation pre-ethics ──┼── controller integration
   ├── ethics-agent ──────────────────────────────────┤
   └── frontend-agent static shell ───────────────────┘
                                                        ↓
                                              integration/r1-mvp
                                                        ↓
                                                test-audit-agent
                                                        ↓
                                                human review / PR
```

可以并行：

- calendar 与 core
- knowledge validation 与 ethics engine skeleton
- frontend 静态布局与底层逻辑

必须等待：

- 共享类型冻结后才允许跨代理接入
- Schema 和引用校验通过后才加载正式知识
- core 测试通过后才接入应用服务
- CandidateClaim 接口冻结后 ethics 才完成 effect 集成
- 伦理集成完成后才运行完整黄金与红队样例
- test-audit 必须在整合完成后独立运行

## 7. 实现顺序

```text
1. architecture-agent 建立脚手架与共享类型
2. knowledge-agent 建立 Schema 与引用验证
3. core-agent 实现冻结算法
4. calendar-agent 完成手动农历适配
5. knowledge-agent 实现不可变知识加载与解释前半段
6. ethics-agent 实现规则引擎
7. controller 建立 runDivination 应用服务
8. fixtures 全部运行
9. frontend 接入服务
10. calendar-agent 接入公历转换
11. test-audit 独立审计
12. controller 开 R1 MVP PR
```

## 8. 第一轮最小闭环

### 阶段 A：脚手架

- React + TypeScript strict + Vite
- Vitest
- Draft 2020-12 Schema 校验
- 基础 CI
- 无远程 AI 依赖

### 阶段 B：验证

- 数据 Schema
- 请求和结果 Schema
- 跨文件引用
- fixture 校验
- 现代文本审计
- 网络依赖审计

### 阶段 C：核心

- 手动农历适配
- 传统推理机
- trace
- 固定向量与属性测试

### 阶段 D：知识与解释

- 六宫知识加载
- 领域与阶段解释
- 片段选择
- Candidate Claims
- 来源追踪

### 阶段 E：伦理

- 条件与 effect
- severity 合并
- claim 抑制
- hard-stop
- 受控安全文案
- 红队案例

### 阶段 F：界面

- 输入和复核
- trace
- 现代解释
- 原典和来源
- 伦理提示
- provenance
- 六宫资料库基础页

### 阶段 G：审计

- 全部测试
- build
- offline 与网络扫描
- UI 截图
- 验收清单

## 9. 子代理报告格式

每个子代理结束时必须提交：

```markdown
## Scope

## Branch / Worktree

## Files changed

## Decisions

## Contracts consumed

## Shared interface changes

## Tests actually run

## Results and exit codes

## Known limitations

## Conflicts or unresolved questions
```

“测试通过”必须附实际命令。无法运行时写明原因。

## 10. 合并门槛

合并到整合分支前必须满足：

- 核心算法向量通过
- 传统示例通过
- 数学属性测试通过
- JSON 通过 Schema
- 所有引用 ID 存在
- fixture 文件可校验
- 黄金样例通过
- 伦理红队样例通过
- 规则冲突样例通过
- 没有远程生成式 AI 调用
- 身份字段未进入核心算法
- 健康不能输出诊断和风险排除
- 感情不能推断第三方身份
- 明确拒绝不能被吉宫覆盖
- 失联危险场景触发 hard-stop
- 空亡不能生成死亡或绝症断言
- 伦理前后落宫一致
- 结果通过输出 Schema

最终 R1 合并还必须满足 `codex/batch-04-acceptance-criteria.md`。

## 11. 冲突升级

以下问题必须交给人工决定：

- 原典版本冲突
- 小吉五行等异文选择
- 子时换日默认策略变更
- 闰月默认策略变更
- 新增流派算法
- 删除传统原文
- 改变冻结公式或宫序
- 伦理规则与传统解释的边界争议
- 引入远程服务或生成式模型

总控代理应提供候选方案、来源、影响范围、fixture 差异和测试结果，不得代替人工作最终裁决。

## 12. 完成定义

完成不等于“页面能打开”。R1 完成必须同时具备：

- 可运行应用
- 可验证知识
- 正确算法
- 可追踪解释
- 有效伦理守卫
- 通过黄金和红队案例
- 成功构建
- 独立审计
- README 与实际状态一致
