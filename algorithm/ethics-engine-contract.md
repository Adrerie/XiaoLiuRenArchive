# Ethics Rule Engine Contract

Status: `FROZEN-PROVISIONAL`

本文件定义伦理规则引擎如何读取事实、评估规则、阻止结论并生成可追踪结果。伦理层只约束解释，不得修改历法或落宫。

## 1. 输入

```ts
interface EthicsEvaluationInput {
  domainId: string;
  stageId: string | null;
  questionContext: QuestionContext;
  candidateClaims: CandidateClaim[];
  selectedFragmentIds: string[];
  rules: EthicsRule[];
}
```

引擎只能使用显式字段。不得从自由文本猜测第三方身份、疾病或犯罪事实。自由文本分类器如果存在，只能产生待用户确认的 flag，不能直接形成事实。

## 2. 输出

```ts
interface EthicsEvaluationResult {
  mode: 'allow' | 'allow_with_constraints' | 'hard_block' | 'hard_stop';
  triggeredRuleIds: string[];
  retainedClaims: CandidateClaim[];
  suppressedClaims: SuppressedClaim[];
  blockedFragmentIds: string[];
  forcedConclusionCodes: string[];
  requiredNoticeIds: string[];
  requiredNotices: string[];
  requiredRealityActions: string[];
  preferredTerms: string[];
  forbiddenTerms: string[];
  trace: EthicsTraceEvent[];
}
```

`hard_stop` 表示系统不得把占断作为当前主要行动，例如人员失联并存在现实危险。传统落宫仍可保存在审计对象中，但 UI 必须优先显示现实求助，并默认折叠解释。

## 3. 规则排序

固定排序：

1. `priority` 降序
2. `id` 升序

同一规则集和输入必须产生相同顺序。规则对象不得依赖 JSON 文件中的物理排列顺序。

## 4. 条件语义

第一版必须支持：

- `always`
- `domainEquals`
- `factEquals`
- `questionHasAnyFlag`
- `outputContainsAnyTag`

未识别的条件类型必须报错，不得当作 false 静默忽略。

### factEquals

路径从已经通过 Schema 的 `questionContext` 读取。不存在的路径视为配置错误，而不是 false。

### questionHasAnyFlag

只匹配已登记 flag。由自动分类产生但未获用户确认的高风险 flag，应记录来源为 `classifier_unconfirmed` 并触发保守提示，不得形成第三方事实。

### outputContainsAnyTag

匹配 Candidate Claims 与已选片段的 tags。不得对最终自然语言做模糊关键词扫描来代替结构化标签。

## 5. Effect 语义

### suppress_claim_types

移除指定 claim type 的所有 Candidate Claims，并记录：

- claim ID
- rule ID
- 原始片段 ID
- 抑制原因

不得用同义句重新生成相同结论。

### force_conclusion

加入一个受控结论代码。代码必须从本地 conclusion registry 映射为文本。不得在规则执行器中直接自由写长段文案。

### block_fragments_with_tags

移除所有具有任一指定 tag 的片段。被移除片段不得留在导出文本中，但应保留在内部 trace。

### allow_topics

当敏感主题被阻止后，限制可继续讨论的主题范围。例如不能判断第三方性取向，但可以讨论可观察互动、沟通状态和求测者边界。

### preferred_terms

规定关系与身份语境中的优先词汇。它不修改事实，只影响称谓层。

### forbid_terms_as_inference

禁止把列出的术语当作推断结论。原典中出现时仍可在历史文本栏展示，并附语境说明。

### require_reality_action

添加现实行动代码。代码必须映射为明确、非夸张、可执行的提示。

### stop_divination_as_primary_action

把整体 mode 提升为 `hard_stop`。后续低优先级规则不得降级。

### forbid_action_types

阻止系统给出对应行为指令，例如基于占断买入、卖出、转账、加杠杆或继续纠缠。

### replace_certainty_terms

仅作为兼容保护，不是主要安全机制。正式实现仍应依赖 claim types 和结构化片段。

### assert_invariant

运行时断言。失败必须使整个请求失败，不得继续生成结果。

### assert_priority

在冲突时声明现实证据高于占断解释。该 effect 应反映在最终 section 顺序和 conclusion 中。

### historical_text_only

指定词语只允许出现在传统原文或历史语境 section，不得进入现代结论或行动建议。

## 6. Severity 合并

严重度从低到高：

```text
language-constraint
hard-constraint
hard-block
hard-stop
```

最终 mode 取所有命中规则中的最高等级。低优先级规则不得撤销高等级效果。

## 7. 冲突处理

### 同类效果

- suppress 与 allow 冲突时，suppress 优先。
- block fragment 与 select fragment 冲突时，block 优先。
- forbidden term 与 preferred term 冲突时，forbidden 优先并报告知识配置冲突。
- 多个 required notice 全部保留，按规则优先级排序后去重。
- 多个 reality action 全部保留，但相同 action code 去重。

### 强制结论冲突

若两个 `force_conclusion` 语义互斥，且没有更高优先级解决，返回 `RULE_CONFLICT_ERROR`。不得任选一个。

### 现实事实与宫位

现实明确拒绝、正式检查、合同、警方信息等不会删除宫位，但必须阻止相反的推断。示例：速喜可以保留为“事件或消息较快”的传统象意，却不能成为“对方其实同意”的证据。

## 8. 必须实现的安全不变量

1. `finalPalaceId` 在伦理求值前后完全相同。
2. 身份字段不进入传统计算。
3. 被 suppress 的 claim 不得出现在任何用户可见文本。
4. `hard_stop` 场景不能以吉凶结果作为首屏主结论。
5. 明确拒绝不能被任何关系片段覆盖。
6. 第三方身份不能从宫位推断。
7. 健康输出不能诊断或排除风险。
8. 财务输出不能给买卖、转账或收益保证。
9. 法律输出不能保证裁判、刑罚或执法结果。
10. 传统鬼神词语不能作为现实因果结论。

## 9. 日志与隐私

伦理 trace 默认只保存规则 ID、claim ID、片段 ID和结构化 flag。不得默认记录完整问题文本、姓名、联系方式或第三方敏感身份。

调试日志不得上传远程。生产构建应关闭包含完整 questionText 的日志。

## 10. 测试要求

至少覆盖：

- 规则排序稳定性
- 未知 condition 和 effect fail closed
- severity 不可降级
- 多规则 notice 去重
- 明确拒绝与速喜、小吉冲突
- 第三方性取向询问
- 病情严重程度询问
- 投资收益保证
- 诉讼结果保证
- 人员失联危险场景 hard stop
- 寻物时无证据指控盗窃
- 自杀、寿命和死亡日期询问
- 鬼神或诅咒归因
- 未成年人安全场景
- 伦理前后落宫 invariant
