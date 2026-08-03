# 09 输出合同

## 1. 目标

输出合同保证排盘结果不是一段不可审计的文案，而是由计算事实、传统知识、现代解释和伦理规则共同组成的结构化记录。UI、导出、Android 与未来其他客户端必须消费同一合同。

## 2. 顶层结构

```ts
interface DivinationResult {
  resultVersion: string;
  createdAt: string;
  input: NormalizedInput;
  calendar: CalendarResolution;
  calculation: TraditionalCalculation;
  interpretation: InterpretationResult;
  ethics: EthicsEvaluation;
  provenance: Provenance;
}
```

## 3. 输入

```ts
interface NormalizedInput {
  inputMode: 'solar_datetime' | 'manual_lunar';
  timezone: string;
  solarDateTime?: string;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  earthlyBranch: EarthlyBranch;
  earthlyBranchIndex: number;
  domainId: string;
  stageId?: string;
  questionFlags: string[];
}
```

姓名、性别、性取向、性别身份、民族与宗教不得进入核心算法输入。客户端可为称谓或无障碍体验临时保存偏好，但算法输出不得依赖这些字段。

## 4. 历法解析

```ts
interface CalendarResolution {
  calendarPolicyId: string;
  localDateTime?: string;
  resolvedLunarDate: {
    year?: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
  boundaryDecision: {
    mode: 'civil_midnight' | 'zi_hour_23' | 'split_early_late_zi';
    appliedDayOffset: -1 | 0 | 1;
  };
  warnings: string[];
}
```

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
  trace: CalculationTraceStep[];
}
```

每个 trace step 至少包含：

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

`calculation` 对象只能由传统推理机生成，解释引擎不得修改。

## 6. 解释结果

```ts
interface InterpretationResult {
  domainId: string;
  stageId?: string;
  certaintyMode: 'symbolic-non-deterministic';
  sections: {
    neutralSummary: string[];
    traditionalText: TraditionalTextView[];
    domainInterpretation: string[];
    actionPrompts: string[];
    realityChecks: string[];
  };
  fragmentIds: string[];
}
```

所有现代文字必须来自本地登记片段或结构化领域知识。客户端不得将无来源的自由生成文本混入正式结果。

## 7. 伦理求值

```ts
interface EthicsEvaluation {
  evaluatedRuleIds: string[];
  triggeredRuleIds: string[];
  blockedClaimTypes: string[];
  requiredNotices: string[];
  forcedConclusionCodes: string[];
  stopPrimaryDivination: boolean;
}
```

伦理引擎可以阻止结论、添加现实行动与降低确定性，但不能更改 `finalPalaceId` 或计算 trace。

## 8. 来源追踪

```ts
interface Provenance {
  knowledgeVersion: string;
  schemaVersions: Record<string, string>;
  sourceIds: string[];
  provisionalSourceIds: string[];
  disputedFieldIds: string[];
  calendarPolicyId: string;
  algorithmId: string;
}
```

当使用 provisional 或 disputed 数据时，UI 与导出结果必须可见，不得只在调试日志中保留。

## 9. 输出顺序

推荐展示顺序：

1. 最终宫位与非确定性说明
2. 月宫、日宫、时宫推演路径
3. 六宫中性象意
4. 传统原文与版本状态
5. 问事领域解释
6. 可执行的现实提示
7. 伦理边界与必要求助提示
8. 来源、算法与历法策略

禁止先显示惊吓性断辞，再把限制说明藏在页面底部。

## 10. 错误输出

错误必须结构化返回：

```ts
interface DomainError {
  code: string;
  message: string;
  recoverable: boolean;
  field?: string;
  details?: Record<string, unknown>;
}
```

最低错误代码：

- `INVALID_LUNAR_MONTH`
- `INVALID_LUNAR_DAY`
- `INVALID_EARTHLY_BRANCH`
- `CALENDAR_OUT_OF_RANGE`
- `TIMEZONE_REQUIRED`
- `AMBIGUOUS_LOCAL_TIME`
- `KNOWLEDGE_SCHEMA_INVALID`
- `REFERENCE_INTEGRITY_FAILED`
- `UNSUPPORTED_CALENDAR_POLICY`

错误不得回退到随机结果，也不得用默认宫位掩盖失败。
