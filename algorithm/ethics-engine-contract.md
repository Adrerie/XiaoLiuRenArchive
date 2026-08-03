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
  selectedFragments: SelectedFragment[];
  rules: EthicsRule[];
  safetyMessages: SafetyMessageRegistry;
}
```

引擎只能使用显式结构化字段。不得从自由文本猜测第三方身份、疾病、犯罪、同意或现实危险事实。自由文本分类器如果存在，只能产生待用户确认的候选 flag，不能直接形成事实。

## 2. 输出

```ts
interface EthicsEvaluationResult {
  mode: 'allow' | 'allow_with_constraints' | 'hard_block' | 'hard_stop';
  triggeredRuleIds: string[];
  retainedClaims: CandidateClaim[];
  suppressedClaims: SuppressedClaim[];
  retainedFragmentIds: string[];
  blockedFragmentIds: string[];
  forcedConclusionCodes: string[];
  requiredNotices: string[];
  requiredRealityActionCodes: string[];
  contextCodes: string[];
  allowedTopics: string[];
  forbiddenActionTypes: string[];
  preferredTerms: string[];
  forbiddenTerms: string[];
  trace: EthicsTraceEvent[];
}
```

`hard_stop` 表示系统不得把占断作为当前主要行动，例如人员失联、医疗急症或立即自伤风险。传统落宫仍保存在审计对象中，但 UI 必须优先显示现实行动，并默认折叠传统解释。

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

### always

当值为 `true` 时无条件命中。若值为 `false` 或非布尔类型，视为规则配置错误。

### domainEquals

与已经通过请求 Schema 和跨文件引用检查的 `domainId` 做严格相等比较。

### factEquals

路径从 `questionContext` 根对象读取，例如：

```text
facts.explicitRefusalExists
facts.immediateSafetyRisk
```

路径不存在视为配置错误，而不是 false。只允许读取 Schema 已登记字段，不得通过动态表达式执行任意代码。

### questionHasAnyFlag

只匹配 `questionContext.flags` 中已登记的 flag。任一命中即为 true。

由自动分类产生但未获用户确认的高风险 flag，应标注来源为 `classifier_unconfirmed`。对于可能造成现实伤害的场景可以触发保守提示，但不能由此断言第三方身份、犯罪或疾病事实。

### outputContainsAnyTag

匹配 Candidate Claims 与已选片段的结构化 tags。不得对最终自然语言做模糊关键词扫描来代替结构化标签。

## 5. Effect 语义

所有 effect 必须由明确执行器处理。未知 effect 必须返回 `UNKNOWN_EFFECT_ERROR` 并 fail closed。

### suppress_claim_types

移除指定 claim type 的所有 Candidate Claims，并记录：

- claim ID
- rule ID
- 原始片段 ID
- 抑制原因

不得用同义句重新生成相同结论。

### force_conclusion

加入一个受控结论代码。代码必须存在于 `knowledge/safety-messages.v1.json` 的 `conclusions` registry，并映射为固定文本。不得在规则执行器中自由写长段文案。

未知 conclusion code 必须报错。

### block_fragments_with_tags

移除所有具有任一指定 tag 的片段。被移除片段不得留在用户可见文本和导出中，但应保留在内部 trace。

### allow_topics

当敏感主题被阻止后，限制可继续讨论的主题范围。例如不能判断第三方性取向，但可以讨论可观察互动、沟通状态和求测者边界。

`allow_topics` 不能重新允许已经被 suppress 的 claim type。

### preferred_terms

规定关系与身份语境中的优先词汇。它不修改事实，只影响称谓层。称谓替换不得改变原典文本。

### forbid_terms_as_inference

禁止把列出的术语当作现代推断结论。原典中出现时仍可在传统文本栏展示，并附历史语境说明。

### require_reality_action

添加现实行动代码。代码必须存在于 `knowledge/safety-messages.v1.json` 的 `realityActions` registry，并映射为明确、非夸张、可执行的固定提示。

未知 action code 必须报错。

### stop_divination_as_primary_action

当值为 `true` 时，把整体 mode 提升为 `hard_stop`。后续低优先级规则不得降级。UI 必须把现实行动置于首屏，并降低传统结果的视觉优先级。

### forbid_action_types

阻止系统给出对应行为指令，例如基于占断买入、卖出、借款、转账、加杠杆或继续纠缠。

实现必须同时检查结构化 action type。文本扫描只能作为附加审计，不能代替结构化阻止。

### replace_certainty_terms

仅作为兼容保护，用于把残留的危险确定性短语替换为边界化表达。它不是主要安全机制。正式实现仍应依赖 claim type、结构化片段和 suppress 逻辑。

替换前后均须进入 trace。不得用它掩盖本应被 suppress 的 claim。

### forbid_certainty_terms

将列出的确定性表达加入禁止词集合。拼接器不得输出这些词，除非它们位于传统原文、用户原问题引述或明确否定语境中。

启发式文本审计必须区分“必然成功”与“不能声称必然成功”。

### preferred_modal_terms

提供允许的非确定性表达，如“可理解为”“提示”“倾向于”“仍需现实核验”。它只约束措辞，不创造新结论。

### assert_invariant

运行时断言。当前至少支持：

- `identity_fields_do_not_change_palace`
- `ethics_does_not_change_final_palace`

断言失败必须使整个请求失败，不得继续生成结果。

### assert_priority

声明冲突时的知识优先级，例如 `verified_reality` 高于 `divination_interpretation`。该 effect 必须反映在最终 section 顺序和结论处理上。

### append_reality_check_when_conflict

当结构化现实事实与传统倾向可能冲突时，加入受控现实核验提示。实现不得每次自由写文案，默认使用 `verified_reality_has_priority` context code。

### historical_text_only

指定词语只允许出现在传统原文或历史语境 section，不得进入现代结论或行动建议。

### append_context

添加一个受控语境代码。代码必须存在于 `knowledge/safety-messages.v1.json` 的 `contexts` registry。未知 context code 必须报错。

### require_evidence_language

要求相关输出明确使用证据边界，例如“宫位不能证明具体人员实施违法行为”。它必须配合 claim suppression，不能只追加免责声明后仍保留指控。

### exclude_from_core_input

声明哪些请求字段必须在进入传统核心前剥离。实现应在应用服务边界构造一个全新的 `NormalizedLunarInput`，而不是把完整 request 传入 core 后期待 core 忽略字段。

如果 core API 接收了被排除字段，`assert_invariant` 和架构测试必须失败。

## 6. Severity 合并

严重度从低到高：

```text
notice
language-constraint
hard-constraint
hard-block
hard-stop
```

最终 mode 由所有命中规则中的最高等级决定：

- `notice` 和无安全限制可映射为 `allow`
- `language-constraint`、`hard-constraint` 可映射为 `allow_with_constraints`
- `hard-block` 映射为 `hard_block`
- `hard-stop` 映射为 `hard_stop`

低优先级规则不得撤销高等级效果。

## 7. 冲突处理

### 同类效果

- suppress 与 allow 冲突时，suppress 优先。
- block fragment 与 select fragment 冲突时，block 优先。
- forbidden term 与 preferred term 冲突时，forbidden 优先并报告知识配置冲突。
- 多个 required notice 全部保留，按规则优先级排序后去重。
- 多个 reality action 全部保留，但相同 action code 去重。
- 多个 context code 去重，顺序按触发规则优先级确定。
- `hard_stop` 不可被其他规则降级。

### 强制结论冲突

若两个 `force_conclusion` 语义互斥，且没有更高优先级解决，返回 `RULE_CONFLICT_ERROR`。不得任选一个。

### 现实事实与宫位

现实明确拒绝、正式检查、合同、警方信息等不会删除宫位，但必须阻止相反推断。速喜可以保留为“事件或消息较快”的传统象意，却不能成为“对方其实同意”的证据。

## 8. 必须实现的安全不变量

1. `finalPalaceId` 在伦理求值前后完全相同。
2. 身份和问题字段不进入传统计算。
3. 被 suppress 的 claim 不得出现在任何用户可见文本。
4. `hard_stop` 场景不能以吉凶结果作为首屏主结论。
5. 明确拒绝不能被任何关系片段覆盖。
6. 第三方身份不能从宫位推断。
7. 健康输出不能诊断或排除风险。
8. 医疗急症不能因吉宫延迟现实求助。
9. 财务输出不能给买卖、转账或收益保证。
10. 法律输出不能保证裁判、刑罚或执法结果。
11. 传统鬼神词语不能作为现实因果结论。
12. 无证据时不能指控具体人员犯罪。
13. 人员失联危险必须触发 hard-stop。
14. 立即自伤风险必须触发 hard-stop。
15. 受控 message code 必须全部可解析。

## 9. 日志与隐私

伦理 trace 默认只保存规则 ID、claim ID、片段 ID 和结构化 flag。不得默认记录完整问题文本、姓名、联系方式或第三方敏感身份。

调试日志不得上传远程。生产构建应关闭包含完整 `questionText` 的日志。

## 10. 测试要求

至少覆盖：

- 规则排序稳定性
- 未知 condition 和 effect fail closed
- 未知 conclusion、action 和 context code fail closed
- severity 不可降级
- 多规则 notice 和 action 去重
- 明确拒绝与速喜、小吉冲突
- 第三方性取向询问
- 病情严重程度询问
- 医疗急症 hard-stop
- 投资收益保证
- 诉讼结果保证
- 人员失联危险 hard-stop
- 寻物时无证据指控盗窃
- 自伤立即风险 hard-stop
- 寿命和死亡日期询问
- 鬼神或诅咒归因
- 未成年人安全场景
- 伦理前后落宫 invariant
- 被 suppress claim 不通过同义词重新出现
