# XiaoLiuRenArchive · 小六壬档案

一个面向传统小六壬知识整理、规则推演与现代语境解释的本地专家系统。

本项目以传统报时起课法为计算核心，以结构化知识库保存六宫资料、版本异文、问事解释、受控安全文案与伦理规则。全部核心推演在本地完成，不接入生成式 AI、远程断语服务或云端推理 API。

> 术数计算遵循传统，文本解释区分古今，产品设计服从现代伦理。

## 当前状态

Batch 02、Batch 03 与 Batch 04 的知识、算法和实现交接规范已经完成。

当前仓库已经建立：

- 专家系统总体架构
- 传统起课算法合同
- 历法、子时换日与闰月策略
- 六宫结构化知识库
- 问事领域和阶段解释
- 解释规则引擎合同
- 伦理规则引擎合同
- 同性关系与多元性别伦理规则
- 医疗、法律、财务、生死、失踪、犯罪指控和超自然归因边界
- 请求、上下文和结果 JSON Schema
- 受控安全结论与现实行动代码表
- 规则冲突样例
- 解释黄金样例
- 伦理红队样例
- 产品需求和 UI 信息架构
- Codex 总控计划、验收标准和七份子代理任务书
- 关键架构决策记录

尚未完成：

- React 与 TypeScript 工程实现
- 本地历法适配器代码
- 传统推理机、解释引擎和伦理引擎代码
- 知识校验脚本的实际实现和运行
- Web 用户界面
- 自动化测试、CI 与正式构建
- Android 封装、导出和发布

因此，仓库当前是**完整的 R1 实现规范与本地知识基础**，还不是已经发布的成品应用。下一步应直接由 Codex 使用子代理进入工程实现，不再继续无限扩写规划。

## 系统定位

XiaoLiuRenArchive 采用经典专家系统思路，但不声称小六壬经过现代科学验证，也不把传统断辞包装成确定预测。

系统包含三个严格分层的执行部分。

### Calendar Adapter

将手动农历或公历本地日期时间转换为规范化农历月、日和十二时辰序号。所有争议策略通过 `calendarPolicyId` 显式选择。

### Traditional Inference Engine

传统推理机只负责月、日、时起课。它必须是确定性的纯函数，同一输入在不同设备上得到相同结果。

固定顺序：

```text
大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡
```

固定计算：

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

系统不仅返回最终宫位，还必须返回月宫、日宫、时宫的完整推演轨迹。

### Interpretation and Ethics Engines

解释规则引擎根据最终宫位、问事领域、事件阶段和本地片段库产生 Candidate Claims。伦理引擎再依据结构化事实、风险 flag 和规则优先级阻止不允许的结论，加入现实行动和边界提示。

伦理引擎不能修改传统落宫。正式解释不能由生成式模型或自由文本逻辑补写。

## 现代伦理原则

身份信息不参与核心算法。性别、性取向、性别认同、婚姻形式、民族、宗教、残障或经济状况均不得改变落宫。

关系解释统一使用“求测者”“对方”“伴侣”“关系对象”等角色词。项目明确禁止：

- 把同性伴侣强制映射为夫位与妻位
- 用攻受、气质、外貌或表达方式分配阴阳
- 推断第三方的性取向、性别身份、出柜状态或性行为角色
- 用吉宫覆盖现实中的拒绝、撤回或同意边界
- 把异性婚育当作关系成功的必要条件
- 将同性关系解释为所谓阴阳不全

健康、法律、财务、生死、失踪和犯罪指控等高风险问题必须经过伦理规则引擎。现实危险场景可触发 `hard-stop`，使现实求助先于传统结果展示。

## 知识与来源政策

传统原文、现代释义和版本异文分层保存。

当前六宫详细断辞仍属于 `provisional-transcription`。网络录文只作为校勘线索，不自动升级为正式原典。李淳风等作者名称按文本题署记录，不直接视为已证实的历史作者归属。

同一属性存在不同流传版本时，必须登记：

- 基准值
- 异文值
- 各自来源
- 证据状态
- 当前采用理由

例如小吉五行在不同现代资料中存在木、水差异，仓库保留争议状态，不宣称所有流派一致。

## 第一阶段产品范围

- 公历转农历与手动农历输入
- IANA 时区、十二时辰和子时换日策略
- 大安、留连、速喜、赤口、小吉、空亡六宫
- 月宫、日宫、时宫完整推演路径
- 原典、异文、现代释义和来源分层
- 感情、学业、事业、财务、出行、寻物、健康和法律领域
- 关系或事件阶段
- 用户明确现实事实与风险 flag
- 同性关系、跨性别与非二元用户的平等解释
- 医疗、法律、财务、生死、失踪、同意和第三方隐私边界
- 本地知识加载、结构化结果和可复现测试
- 移动端优先 Web 界面和六宫资料库

## 暂不纳入

- 大六壬天地盘、四课三传和十二天将体系
- 未经来源审核的现代秘传或门派扩展
- 随机数字、姓名笔画和时分秒附加起课
- AI 自动断语或远程推理服务
- 付费化解、恐吓式通知和连续重算诱导
- 根据排盘推断疾病、犯罪、死亡或第三方身份
- 账号、云同步、社区和推荐系统
- 第一轮 Android 正式发布和完整 PDF 导出

## 仓库结构

```text
.
├─ README.md
├─ AGENTS.md
├─ CODEX_MASTER_PROMPT.md
│
├─ algorithm/
│  ├─ contract.md
│  ├─ interpretation-engine-contract.md
│  ├─ ethics-engine-contract.md
│  ├─ test-vectors.v1.json
│  └─ rule-conflict-examples.v1.json
│
├─ knowledge/
│  ├─ palaces.v1.json
│  ├─ question-domains.v1.json
│  ├─ interpretation-fragments.v1.json
│  ├─ ethics-rules.v1.json
│  ├─ calendar-policies.v1.json
│  ├─ safety-messages.v1.json
│  ├─ source-registry.json
│  ├─ divination-request.schema.json
│  ├─ question-context.schema.json
│  ├─ divination-result.schema.json
│  └─ *.schema.json
│
├─ fixtures/
│  ├─ case.schema.json
│  ├─ interpretation-golden-cases.v1.json
│  └─ ethics-red-team-cases.v1.json
│
├─ docs/
│  ├─ 00-project-charter.md
│  ├─ 01-system-architecture.md
│  ├─ 02-algorithm-spec.md
│  ├─ 03-calendar-policy.md
│  ├─ 04-knowledge-model.md
│  ├─ 05-review-checklist.md
│  ├─ 06-modern-ethics.md
│  ├─ 07-source-collation.md
│  ├─ 08-testing-standard.md
│  ├─ 09-output-contract.md
│  ├─ 10-product-requirements.md
│  ├─ 11-ui-information-architecture.md
│  ├─ 12-batch-04-summary.md
│  └─ adr/
│
├─ codex/
│  ├─ orchestration.md
│  ├─ batch-03-implementation-gate.md
│  ├─ batch-04-implementation-plan.md
│  ├─ batch-04-acceptance-criteria.md
│  └─ tasks/
│
└─ scripts/
   ├─ README.md
   └─ validation-manifest.json
```

## Codex 开发入口

Codex 总控代理必须首先阅读：

1. `README.md`
2. `AGENTS.md`
3. `CODEX_MASTER_PROMPT.md`
4. `codex/batch-04-implementation-plan.md`
5. `codex/batch-04-acceptance-criteria.md`
6. 自己和每个子代理对应的 `codex/tasks/*.md`
7. 三份 algorithm contract
8. request、context 和 result Schema
9. 黄金、红队和规则冲突样例
10. 全部知识数据与 Schema

必须实际使用：

- `architecture-agent`
- `calendar-agent`
- `core-algorithm-agent`
- `knowledge-agent`
- `ethics-agent`
- `frontend-agent`
- `test-audit-agent`

推荐独立 worktree 和 feature branch，最后在 `integration/r1-mvp` 整合。

## R1 工程目标

第一轮实现只构建最小但完整的闭环：

1. React、TypeScript strict、Vite 与 Vitest
2. JSON Schema 和跨文件引用校验
3. 手动农历输入
4. 一套公历与时区转换路径
5. 冻结核心起课和完整 trace
6. 不可变知识加载
7. 解释片段和 Candidate Claims
8. 本地伦理规则求值
9. 结构化结果
10. 移动端优先页面
11. 黄金样例和红队样例
12. CI、build、offline 与网络审计

## 验收原则

R1 必须对照 `codex/batch-04-acceptance-criteria.md`。最低要求包括：

- 农历三月初五辰时落小吉
- 12 × 30 × 12 数学枚举
- 逐步算法与压缩公式等价
- 身份不影响落宫
- 所有 JSON Schema 和引用通过
- 黄金样例通过
- 伦理红队样例通过
- 明确拒绝不可被吉宫覆盖
- 第三方身份不可推断
- 医疗、财务、法律和失踪守卫有效
- 伦理前后落宫不变
- 结果符合输出 Schema
- 问题文本不上传
- `npm run build` 成功
- 独立 test-audit-agent 审计

不得通过修改预期结果来迎合错误实现，也不得把未运行的测试描述为已经通过。

## 参与开发

所有开发者和自动化代理均受 `AGENTS.md` 约束。

提交或 Pull Request 必须说明：

- 修改了哪一层
- 使用了哪些子代理
- 是否影响落宫
- 是否改变传统知识
- 使用了哪些来源
- 实际运行了哪些测试
- 尚存哪些异文、历法或伦理问题

本项目当前处于**实现规范完成，R1 工程开发待开始**阶段。
