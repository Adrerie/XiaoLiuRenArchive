# XiaoLiuRenArchive · 小六壬档案

一个面向传统小六壬知识整理、规则推演与现代语境解释的本地专家系统。

本项目以传统报时起课法为计算核心，以结构化知识库保存六宫资料、版本异文、问事解释、受控安全文案与伦理规则。核心推演在本地完成，不接入生成式 AI、远程断语服务或云端推理 API。

> 术数计算遵循传统，文本解释区分古今，产品设计服从现代伦理。

## 当前状态

Batch 02、Batch 03 与 Batch 04 的知识、算法和实现合同已经完成。下一步是直接实现 R1 Local Web MVP，不再继续扩写规划。

已经具备：

- 冻结的月、日、时起课算法
- 历法策略与完整 trace 合同
- 六宫、领域、阶段、来源和异文知识库
- 解释规则与伦理规则合同
- 请求和结果 JSON Schema
- 黄金样例与关键伦理案例
- 产品需求、UI 信息架构和子代理任务书

尚未完成：

- React 与 TypeScript 工程
- 历法适配、核心推理、解释和伦理引擎代码
- 可操作的 Web 界面
- 必要测试、构建和截图

## 执行优先

所有后续计划遵循 `codex/execution-first-policy.md`。

默认优先级：

```text
实际实现 > 核心功能测试 > 必要修正 > 文档记录
```

开始时只由主代理快速阅读入口文件。子代理只读取自己的任务书和直接依赖，不进行全仓扫描。已经确认的架构和需求直接继承。验证只保留构建、核心测试、关键交互实测和少量截图。失败时只追查对应模块。

## 系统结构

```text
用户请求
  ↓
Calendar Adapter
  ↓
Traditional Inference Engine
  ↓
Interpretation Rule Engine
  ↓
Ethics Rule Engine
  ↓
DivinationResult
  ↓
本地 Web UI
```

### 冻结算法

六宫顺序：

```text
大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡
```

计算：

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

核心函数只接收农历月、农历日和十二时辰序号。问题文本、领域、性别、性取向和其他身份字段不得进入计算。

## 现代伦理底线

- 同性、双性、无性、跨性别与非二元关系按正常亲密关系处理
- 不强制映射夫位、妻位、攻受或性别化阴阳角色
- 不推断第三方性取向、性别身份或出柜状态
- 明确拒绝和现实危险优先于占断
- 不输出医疗诊断、收益保证、法律保证、死亡预测或无证据犯罪指控
- 伦理引擎可以阻止结论，但不能修改落宫

## R1 Local Web MVP

第一轮只完成最小可操作闭环：

1. React、TypeScript strict、Vite
2. 手动农历输入
3. 一条公历与时区转换路径
4. 核心起课和完整 trace
5. 六宫知识与领域解释
6. 伦理规则求值
7. 结果总览、推演路径、现代解释、原典与来源
8. 移动端优先界面
9. 构建、核心测试、关键伦理测试和主要流程实测

不优先开发复杂动画、账号、云同步、社区、付费、Android 发布和完整 PDF 导出。

## Codex 开发入口

主代理只需先阅读：

1. `README.md`
2. `AGENTS.md`
3. `CODEX_MASTER_PROMPT.md`
4. `codex/execution-first-policy.md`
5. `codex/batch-04-implementation-plan.md`
6. `codex/batch-04-acceptance-criteria.md`

随后分配子代理。每个子代理只阅读对应 `codex/tasks/*.md` 和其中列出的直接依赖。

强制角色：

- `architecture-agent`
- `calendar-agent`
- `core-algorithm-agent`
- `knowledge-agent`
- `ethics-agent`
- `frontend-agent`
- `test-audit-agent`

其中 `test-audit-agent` 只做一次针对整合结果的必要验证，不进行全仓回溯式审计。

## 必要验收

R1 只以这些项目作为默认合并门槛：

- `npm run build` 成功
- 农历三月初五辰时得到小吉
- 核心算法保持确定性，身份字段不影响落宫
- 手动农历主流程可以完成并显示 trace
- 明确拒绝、第三方身份、健康、财务和失联危险的关键守卫有效
- 结果符合输出合同
- 问题文本不上传
- 移动端和桌面端各保留一张代表性截图

其他全量验证只在相关结构变更、跨模块故障或正式发布前运行。

## 仓库入口

- `algorithm/`：传统计算、解释与伦理合同
- `knowledge/`：结构化知识、规则和 Schema
- `fixtures/`：黄金与伦理案例
- `docs/`：产品、UI、来源和历史决策
- `codex/`：执行计划与子代理任务书
- `scripts/`：知识校验脚本规范

本项目当前处于**规范完成，R1 工程实现待开始**阶段。
