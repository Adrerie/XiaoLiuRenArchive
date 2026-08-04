# 09 输出合同

Version: `1.1.0`

## 1. 目标

输出合同保证排盘结果不是一段不可审计的文案，而是由输入摘要、历法解析、传统计算、知识解释、伦理规则和来源追踪共同组成的结构化记录。Web、导出、Android 与未来其他客户端必须消费同一合同。

正式运行时以 `knowledge/divination-result.schema.json` 为机器可验证规范，本文件解释其语义。

## 2. 顶层结构

```ts
interface DivinationResult {
  resultVersion: '1.1.0';
  createdAt?: string | null;
  input: SanitizedInputSummary;
  calendar: CalendarResolution;
  calculation: TraditionalCalculation;
  interpretation: InterpretationResult;
  ethics: EthicsEvaluationResult;
  provenance: Provenance;
}
```

`createdAt` 是可选展示元数据，不参与确定性比较。相同请求、知识版本和规则版本的确定性要求针对其他语义字段。

## 3. 输入摘要

输出不回显完整请求对象，而是保存经过隐私处理的摘要。

```ts
interface SanitizedInputSummary {
  inputMode: 'civil_datetime' | 'manual_lunar';
  timezone: string | null;
  localDateTime: string | null;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  earthlyBranch: EarthlyBranch;
  earthlyBranchIndex: number;
  domainId: string;
  stageId: string | null;
  questionFlags: string[];
  privacy: {
    questionTextStored: boolean;
    questionTextIncludedInExport: boolean;
  };
}
```

默认不包含完整 `questionText`、姓名、代词、性别、性取向或第三方敏感信息。显示身份字段不属于算法输入，也不应默认进入结果档案。

## 4. 历法解析

```ts
interface CalendarResolution {
  calendarPolicyId: string;
  localDateTime: string | null;
  timezone: string | null;
  resolvedLunarDate: {
    year: number | null;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
  earthlyBranch: EarthlyBranch;
  earthlyBranchIndex: number;
  boundaryDecision: {
    mode: 'civil_midnight' | 'zi_hour_23' | 'split_early_late_zi';
    appliedDayOffset: -1 | 0 | 1;
    manualInputBypass: boolean;
  };
  trace: Record<string, unknown>[];
  warnings: string[];
}
```

手动农历输入时：

- `manualInputBypass = true`
- `year` 可以为 null
- 系统不声称验证用户输入与公历的一致性

公历模式必须记录时区、边界策略和转换 trace。

## 5. 传统计算

```ts
interface TraditionalCalculation {
  algorithmId: 'traditional-month-day-hour-v1';
  algorithmStatus: 'FROZEN-PROVISIONAL' | 'FROZEN-REVIEWED';
  palaceOrder: PalaceId[];
  monthIndex: number;
  dayIndex: number;
  hourIndex: number;
  monthPalaceId: PalaceId;
  dayPalaceId: PalaceId;
  finalPalaceId: PalaceId;
  trace: [CalculationTraceStep, CalculationTraceStep, CalculationTraceStep];
}
```

trace 顺序固定为月、日、时。每个 step 至少包含：

```ts
interface CalculationTraceStep {
  stage: 'month' | 'day' | 'hour';
  startPalaceId: PalaceId;
  countValue: number;
  offset: number;
  resultIndex: number;
  resultPalaceId: PalaceId;
  formula: string;
}
```

`calculation` 只能由传统推理机生成。解释和伦理引擎必须把它视为不可变对象。

## 6. 内容块

所有用户可见的正式解释使用结构化内容块：

```ts
interface ContentBlock {
  id: string;
  text: string;
  kind: string;
  sourceIds: string[];
  status: 'provisional' | 'reviewed' | 'canonical' | 'disputed';
}
```

`id` 可以是片段 ID、领域块 ID、传统文本 ID或受控安全消息 ID。无 ID 的自由文本不能进入正式结果。

## 7. 解释结果

```ts
interface InterpretationResult {
  domainId: string;
  stageId: string | null;
  certaintyMode: 'symbolic-non-deterministic';
  sections: {
    neutral: ContentBlock[];
    domain: ContentBlock[];
    stage: ContentBlock[];
    actions: ContentBlock[];
    traditionalText: ContentBlock[];
    historicalContext: ContentBlock[];
    realityChecks: ContentBlock[];
    ethicsNotices: ContentBlock[];
  };
  fragmentIds: string[];
  candidateClaimIds: string[];
  trace: Record<string, unknown>[];
}
```

固定组装顺序：

1. 中性宫位象意
2. 领域解释
3. 阶段修正
4. 可执行行动
5. 传统原文
6. 历史语境
7. 现实核验
8. 伦理提示

`hard-stop` 场景的 UI 可以把现实行动置于整个页面最前，但结构化 section 仍保持可追踪顺序。

所有现代文字必须来自本地登记片段、结构化领域知识或受控安全文案。客户端不得将自由生成文本混入正式结果。

## 8. 被抑制结论

```ts
interface SuppressedClaim {
  claimId: string;
  claimType: string;
  ruleId: string;
  fragmentIds: string[];
  reasonCode: string;
}
```

被抑制 claim 不得出现在任何用户可见 section 或导出正文中。它只保留在内部审计结构和开发者可见 provenance 中。

## 9. 伦理求值

```ts
interface EthicsEvaluationResult {
  mode: 'allow' | 'allow_with_constraints' | 'hard_block' | 'hard_stop';
  evaluatedRuleIds: string[];
  triggeredRuleIds: string[];
  retainedClaimIds: string[];
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
  stopPrimaryDivination: boolean;
  trace: Record<string, unknown>[];
}
```

受控代码必须分别解析自：

- `knowledge/safety-messages.v1.json#/conclusions`
- `knowledge/safety-messages.v1.json#/realityActions`
- `knowledge/safety-messages.v1.json#/contexts`

伦理引擎可以阻止结论、屏蔽片段、加入现实行动并调整显示优先级，但不能更改 `finalPalaceId`、索引或计算 trace。

### Mode 含义

- `allow`：无额外限制的普通文化解释
- `allow_with_constraints`：存在语言、现实核验或角色边界
- `hard_block`：一个或多个请求结论必须被阻止，但仍可展示安全范围内的传统结果
- `hard_stop`：现实安全行动必须成为首要内容，占断不能作为当前主要行动

## 10. 来源追踪

```ts
interface Provenance {
  knowledgeVersion: string;
  ruleVersion: string;
  schemaVersions: Record<string, string>;
  sourceIds: string[];
  provisionalSourceIds: string[];
  disputedFieldIds: string[];
  calendarPolicyId: string;
  algorithmId: 'traditional-month-day-hour-v1';
  fragmentIds: string[];
  ethicsRuleIds: string[];
}
```

当使用 provisional 或 disputed 数据时，UI 与导出结果必须可见，不得只在调试日志中保留。

## 11. 用户界面展示顺序

普通结果推荐：

1. 最终宫位与非确定性说明
2. 月宫、日宫、时宫推演路径
3. 六宫中性象意
4. 当前领域和阶段解释
5. 可执行现实行动
6. 传统原文与版本状态
7. 伦理边界
8. 来源、算法与历法策略

`hard-stop` 结果推荐：

1. 紧急或现实安全行动
2. 已核验事实与边界
3. 受控结论
4. 折叠的传统结果
5. 来源与审计信息

禁止先显示惊吓性断辞，再把限制说明藏在页面底部。

## 12. 错误输出

错误不属于 `DivinationResult`，应使用独立 discriminated union 返回：

```ts
interface DomainError {
  ok: false;
  error: {
    code: string;
    message: string;
    recoverable: boolean;
    field?: string;
    details?: Record<string, unknown>;
  };
}
```

最低错误代码：

- `REQUEST_SCHEMA_INVALID`
- `INVALID_LUNAR_MONTH`
- `INVALID_LUNAR_DAY`
- `INVALID_EARTHLY_BRANCH`
- `CALENDAR_OUT_OF_RANGE`
- `TIMEZONE_REQUIRED`
- `AMBIGUOUS_LOCAL_TIME`
- `NONEXISTENT_LOCAL_TIME`
- `KNOWLEDGE_SCHEMA_INVALID`
- `REFERENCE_INTEGRITY_FAILED`
- `UNSUPPORTED_CALENDAR_POLICY`
- `UNKNOWN_RULE_CONDITION`
- `UNKNOWN_RULE_EFFECT`
- `UNKNOWN_SAFETY_MESSAGE_CODE`
- `RULE_CONFLICT_ERROR`
- `OUTPUT_SCHEMA_INVALID`
- `INVARIANT_VIOLATION`

错误不得回退到随机结果、默认宫位或不完整断语。

## 13. 隐私

- 完整问题文本默认不进入结果。
- 身份字段默认不进入结果。
- 被抑制 claim 只保存结构化 ID，不保存敏感自由文本。
- 生产日志不得默认记录完整 request。
- 导出默认移除完整问题和精确时间。

## 14. 确定性

下列字段必须对相同请求和版本保持一致：

- calendar 语义结果
- calculation
- interpretation 片段和顺序
- ethics 规则与效果
- provenance

`createdAt`、本地 UI 展开状态和纯排版差异不属于确定性比较范围。
