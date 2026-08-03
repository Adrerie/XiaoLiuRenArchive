# Interpretation Rule Engine Contract

Status: `FROZEN-PROVISIONAL`

本文件定义解释规则引擎的运行语义。实现可以采用不同代码组织方式，但输入、阶段顺序、冲突处理、可追踪性和失败行为必须一致。

## 1. 职责边界

解释引擎负责把已完成的传统起课结果与本地知识组合为结构化解释。它不负责：

- 公历转农历
- 计算月宫、日宫、时宫
- 修改 `finalPalaceId`
- 自由生成断语
- 推断未由用户明确提供的现实事实
- 根据身份字段改变宫位或中性象意

输入必须来自已经通过 Schema 校验的本地对象。

## 2. 输入

```ts
interface InterpretationInput {
  calculation: {
    algorithmId: string;
    monthPalaceId: PalaceId;
    dayPalaceId: PalaceId;
    finalPalaceId: PalaceId;
    trace: CalculationTraceStep[];
  };
  questionContext: QuestionContext;
  knowledge: ImmutableKnowledgeBundle;
  calendarPolicyId: string;
}
```

`ImmutableKnowledgeBundle` 至少包含：

- `palaces.v1.json`
- `question-domains.v1.json`
- `interpretation-fragments.v1.json`
- `ethics-rules.v1.json`
- `source-registry.json`

加载后不得原地修改。

## 3. 输出

```ts
interface InterpretationDraft {
  palaceId: PalaceId;
  domainId: string;
  stageId: string | null;
  sections: {
    neutral: SelectedFragment[];
    domain: DomainInterpretationBlock | null;
    stage: SelectedFragment[];
    actions: SelectedFragment[];
    historicalContext: SelectedFragment[];
    realityChecks: SelectedFragment[];
    ethicsNotices: SelectedFragment[];
  };
  candidateClaims: CandidateClaim[];
  trace: InterpretationTraceEvent[];
}
```

最终面向 UI 的输出必须保留所有片段 ID、规则 ID 和来源 ID。不得只返回拼接后的字符串。

## 4. 固定执行顺序

### Stage 0: Preconditions

1. 验证输入符合 `divination-request.schema.json`。
2. 验证 `calculation.finalPalaceId` 存在于六宫数据。
3. 验证 `domainId` 存在。
4. 若 `stageId` 非空，验证其属于所选领域。
5. 验证知识包引用完整。

任何前置条件失败时返回结构化错误，不得猜测或自动修补。

### Stage 1: Palace Neutral Layer

选择唯一的中性宫位片段：

```text
kind = neutral_summary
palaceIds contains finalPalaceId
```

若匹配数量不是 1，返回 `KNOWLEDGE_INTEGRITY_ERROR`。

### Stage 2: Domain Layer

从 `question-domains.v1.json` 中选择当前领域与最终宫位对应的解释块。该层提供：

- `summary`
- `supportive`
- `caution`
- `actionPrompts`

领域块是结构化知识，不得被重写为更确定的预言。

### Stage 3: Stage Modifiers

选择同时满足以下条件的片段：

- `kind = stage_modifier`
- `domainIds` 包含当前领域
- `stageIds` 包含当前阶段
- `palaceIds` 包含当前宫位或 `all`

按 `priority` 降序、`id` 升序排序。

### Stage 4: Action Prompts

选择当前宫位的通用行动片段，再加入领域块中的行动提示。行动提示必须是现实中可执行、有限、可拒绝或可核验的建议，不得是仪式性强制行为。

### Stage 5: Historical Context

仅在传统文本包含相关历史词语，或用户主动查看原典说明时，选择 `historical_context` 片段。历史语境不得自动变成现实因果结论。

### Stage 6: Candidate Claim Extraction

引擎必须把可能形成结论的内容表示成 `CandidateClaim`，而不是直接写进最终文本。

```ts
interface CandidateClaim {
  id: string;
  claimType: string;
  sourceKind: 'palace' | 'domain' | 'stage' | 'user_fact' | 'historical_text';
  fragmentIds: string[];
  text: string;
  certainty: 'descriptive' | 'tentative' | 'strong';
  tags: string[];
}
```

这一步使伦理引擎能够阻止结论而不是仅做关键词替换。

### Stage 7: Ethics Evaluation

把 Interpretation Draft 和 Candidate Claims 交给 `Ethics Rule Engine`。伦理引擎返回：

- 被保留的 claims
- 被阻止的 claims
- 强制结论代码
- 必需提示
- 必需现实行动
- 命中的规则 ID

解释引擎不得绕过该结果。

### Stage 8: Reality Evidence Priority

若用户提供正式通知、明确拒绝、检查结果、合同或其他已核验事实，现实事实必须在最终输出中先于传统倾向展示。传统结果可以保留为文化解释，但不能推翻事实。

### Stage 9: Assembly

固定展示顺序：

1. 计算结果与 trace
2. 宫位中性象意
3. 领域解释
4. 阶段修正
5. 可执行行动
6. 传统原文与历史语境
7. 伦理与现实提示
8. 来源与版本

拼接器只负责排版，不得创造新事实或新断语。

## 5. 片段选择规则

- 所有选择必须可由 ID 重现。
- 同一 ID 去重。
- 同一 section 默认最多 4 个片段。
- 优先级相同按 ID 字典序排列，保证跨平台确定性。
- `requiresEthicsRuleIds` 未命中时，不选择该片段。
- 命中 `block_fragments_with_tags` 后，包含相应 tag 的片段必须被移除。
- 被移除片段须进入 trace，标明规则 ID。

## 6. 禁止自由生成

正式模式中不得：

- 根据片段含义自行补写一段新预测
- 将两条弱倾向合并成强确定结论
- 用同义改写绕过禁止词和禁止 claim type
- 将传统原文直接作为现代建议
- 依据用户身份增加未经登记的角色判断

允许的文本变化仅包括：

- 标点与段落排版
- 经过批准的简繁转换
- 代词和称谓替换
- 隐私设置要求的省略

## 7. 错误行为

下列情况必须 fail closed：

- 引用不存在的宫位、领域、阶段、片段或规则
- 同一必选中性片段出现多个候选
- 伦理引擎未返回结果
- 输出无法通过 `divination-result.schema.json`
- 规则冲突没有确定的优先级解决方案

不得静默丢弃错误后继续输出完整断语。

## 8. 确定性

相同的：

- 计算结果
- 问题上下文
- 知识版本
- 规则版本
- 历法策略 ID

必须产生相同的片段选择、规则 trace 和结构化结果。当前时间、设备、随机数和网络状态不得影响输出。

## 9. 测试要求

至少测试：

- 六宫各自唯一中性片段
- 所有领域均存在六宫解释
- 阶段选择正确
- 片段排序与去重
- 缺失引用 fail closed
- 明确拒绝覆盖吉宫关系倾向
- 第三方身份询问阻止 identity claim
- 健康、法律与财务提示必现
- 历史鬼神语言不进入现实因果结论
- 最终结果符合输出 Schema
