# XiaoLiuRenArchive · 小六壬档案

一个面向传统小六壬知识整理、规则推演与现代语境解释的本地专家系统。

本项目以传统报时起课法为计算核心，以结构化知识库保存六宫资料、版本异文、问事解释与伦理规则。全部推演在本地完成，不接入生成式 AI、远程断语服务或云端推理 API。

> 术数计算遵循传统，文本解释区分古今，产品设计服从现代伦理。

## 当前状态

项目目前已完成 Batch 02 与 Batch 03 的基础规范建设，并已合并至 `main`。

已经建立：

- 专家系统总体架构
- 传统起课算法合同
- 历法与子时换日策略
- 六宫结构化知识库
- 问事领域解释规则
- 同性关系与多元性别伦理规则
- 医疗、法律、财务、生死、失踪和第三方隐私边界
- JSON Schema 与结构化输出合同
- 固定测试向量和伦理红队标准
- Codex 总控代理与专职子代理编排

尚未完成：

- React 与 TypeScript 工程实现
- 本地历法适配器
- 传统推理机与解释规则引擎代码
- 知识校验脚本的实际运行
- Web 与 Android 用户界面
- 导出、发布与正式版本测试

因此，仓库当前是**可执行开发规范与知识基础**，还不是已经发布的成品应用。

## 系统定位

XiaoLiuRenArchive 采用经典专家系统思路，但不声称小六壬经过现代科学验证，也不把传统断辞包装成确定预测。

系统由两套相互隔离的推理引擎组成。

### Traditional Inference Engine

传统推理机只负责历法规范化与月、日、时起课。它必须是确定性的纯函数，同一输入在不同设备上得到相同结果。

核心顺序固定为：

```text
大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡
```

核心计算为：

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

系统不仅返回最终宫位，还必须返回月宫、日宫、时宫的完整推演轨迹。

### Interpretation Rule Engine

解释规则引擎根据以下本地知识组合输出：

- 最终宫位
- 月宫、日宫、时宫上下文
- 问事领域
- 关系或事件阶段
- 现代解释片段
- 伦理约束规则
- 来源与版本信息

解释引擎不得改变传统推理机产生的宫位，也不得自由生成未登记的断语。

## 现代伦理原则

身份信息不参与核心算法。性别、性取向、性别认同、婚姻形式、民族、宗教、残障或经济状况均不得改变落宫。

关系解释统一使用“求测者”“对方”“伴侣”“关系对象”等角色词。项目明确禁止：

- 把同性伴侣强制映射为夫位与妻位
- 用攻受、气质、外貌或表达方式分配阴阳
- 推断第三方的性取向、性别身份、出柜状态或性行为角色
- 用吉宫覆盖现实中的拒绝、撤回或同意边界
- 把异性婚育当作关系成功的必要条件
- 将同性关系解释为所谓阴阳不全

健康、法律、财务、生死、失踪和犯罪指控等高风险问题必须经过伦理规则引擎。伦理层可以限制危险结论、增加现实核验和求助提示，但不能修改落宫或伪造更吉利的结果。

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

## 第一阶段范围

- 公历转农历与手动农历输入
- 用户时区、十二时辰和子时换日策略
- 大安、留连、速喜、赤口、小吉、空亡六宫
- 月宫、日宫、时宫完整推演路径
- 原典、异文、现代释义和来源分层
- 感情、学业、事业、财务、出行、寻物、健康和法律问事领域
- 同性关系、跨性别与非二元用户的平等解释
- 医疗、法律、财务、生死、失踪、同意和第三方隐私边界
- 本地知识加载、结构化结果和可复现测试

## 暂不纳入

- 大六壬天地盘、四课三传和十二天将体系
- 未经来源审核的现代秘传或门派扩展
- 随机数字、姓名笔画和时分秒附加起课
- AI 自动断语或远程推理服务
- 付费化解、恐吓式通知和连续重算诱导
- 根据排盘推断疾病、犯罪、死亡或第三方身份

## 仓库结构

```text
.
├─ README.md
├─ AGENTS.md
├─ CODEX_MASTER_PROMPT.md
│
├─ algorithm/
│  ├─ contract.md
│  └─ test-vectors.v1.json
│
├─ knowledge/
│  ├─ palaces.v1.json
│  ├─ question-domains.v1.json
│  ├─ interpretation-fragments.v1.json
│  ├─ ethics-rules.v1.json
│  ├─ calendar-policies.v1.json
│  ├─ source-registry.json
│  └─ *.schema.json
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
│  └─ 10-batch-03-summary.md
│
├─ codex/
│  ├─ orchestration.md
│  └─ batch-03-implementation-gate.md
│
└─ scripts/
   ├─ README.md
   └─ validation-manifest.json
```

## Codex 开发流程

本项目规模较大，Codex 必须使用总控代理与专职子代理，不得由单个代理一次性完成全部工作。

至少需要：

- `architecture-agent`
- `calendar-agent`
- `core-algorithm-agent`
- `knowledge-agent`
- `ethics-agent`
- `frontend-agent`
- `test-audit-agent`

开始开发前应按顺序阅读：

1. `README.md`
2. `AGENTS.md`
3. `CODEX_MASTER_PROMPT.md`
4. `algorithm/contract.md`
5. `codex/batch-03-implementation-gate.md`
6. `docs/` 中的架构、历法、知识、伦理、测试与输出合同
7. `knowledge/` 中的全部数据文件和 Schema

任何影响落宫的修改必须由独立审计子代理复核。前端代理不得修改核心算法，算法代理不得为了界面便利改变传统规则。

## 第一轮工程目标

第一轮实现只构建最小闭环：

1. React、TypeScript strict、Vite 与 Vitest 脚手架
2. JSON Schema 校验和引用完整性检查
3. 手动农历输入与一套默认历法策略
4. 纯函数起课算法及完整 trace
5. 六宫知识加载
6. 一个通用问事解释流程
7. 本地伦理规则求值
8. 结构化结果页面
9. 单元、属性、Schema 和伦理红队测试

第一轮不优先开发复杂动画、账号、云同步、社区、付费功能和 Android 打包。

## 测试原则

正式实现至少必须通过：

- 农历三月初五辰时落小吉的传统示例
- 月、日、时合法范围枚举测试
- 逐步算法与压缩公式等价测试
- 六宫周期测试
- 身份字段不影响落宫的属性测试
- 时区、闰月和子时边界测试
- JSON Schema 与跨文件引用完整性测试
- 第三方性取向不可推断测试
- 现实拒绝不可被吉宫覆盖测试
- 医疗、法律、财务和失踪问题伦理守卫测试

不得通过修改预期结果来迎合错误实现，也不得把未运行的测试描述为已经通过。

## 参与开发

所有开发者和自动化代理均受 `AGENTS.md` 约束。

提交或 Pull Request 必须说明：

- 修改了哪一层
- 是否影响落宫
- 是否改变传统知识
- 使用了哪些来源
- 增加了哪些测试
- 尚存哪些异文、历法或伦理问题

本项目当前处于规范完成、工程实现待开始阶段。
