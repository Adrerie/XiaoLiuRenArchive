# 09 输出合同

Version: `1.3.0`

## 1. 目的

`DivinationResult` 是 Web、Android、归档和 JSON 导出共同消费的本地结构化合同。它保留输入摘要、历法解析、固定算法、知识解释、伦理结果和来源追踪；客户端不得把自由生成的断语混入正式结果。

机器可验证的字段以 `src/shared/types/divination.ts` 和知识清单为准。

## 2. 顶层结构

```ts
interface DivinationResult {
  resultVersion: '1.3.0';
  createdAt: string | null;
  casting: CastingSummary;
  input: CalendarResultInput | ThreeNumberResultInput;
  calendar: CalendarResult | null;
  calculation: TraditionalCalculationResult | ThreeNumberCalculationResult;
  interpretation: InterpretationResult;
  ethics: EthicsResult;
  provenance: Provenance;
}
```

`calendar` 在三数起课时为 `null`。三数起课使用 `casting.kind = 'three_numbers'` 和 `input.kind = 'three_numbers'`，不得伪装为农历月、日、时。

## 3. 起课与输入

```ts
type CastingSummary =
  | { kind: 'calendar'; inputMode: 'civil_datetime' | 'manual_lunar'; calendarPolicyId: string }
  | { kind: 'three_numbers'; algorithmId: 'three-number-sequential-count-v1'; input: ThreeNumberInput };

interface CalendarResultInput {
  kind: 'calendar';
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
  privacy: { questionTextStored: boolean; questionTextIncludedInExport: boolean };
}

interface ThreeNumberResultInput {
  kind: 'three_numbers';
  numbers: { kind: 'three_numbers'; first: string; second: string; third: string };
  timezone: null;
  domainId: string;
  stageId: string | null;
  questionFlags: string[];
  privacy: { questionTextStored: boolean; questionTextIncludedInExport: boolean };
}
```

身份字段、问题文本、系统时间和网络状态不进入固定算法。问题文本默认不进入结果或导出。

## 4. 历法与固定算法

日历结果记录 `calendarPolicyId`、时区、边界决策、转换 trace 和警告。手动农历输入可以没有公历时间；系统不得声称已经核验用户手动输入与公历的一致性。

传统月日时算法只接收农历月、农历日和十二时辰序号，顺序固定为：

```text
大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

`calculation.algorithmId = 'traditional-month-day-hour-v1'` 时，trace 顺序固定为 `month → day → hour`。`three-number-sequential-count-v1` 独立记录三个输入、三个余数和 `threePalaces`，第三宫为当前主判。

## 5. 解释与伦理

正式解释只能来自已登记的 `ContentBlock`：

```ts
interface ContentBlock {
  id: string;
  text: string;
  kind: string;
  sourceIds: string[];
  status: 'provisional' | 'reviewed' | 'canonical' | 'disputed';
}

interface InterpretationSections {
  neutral: ContentBlock[];
  domain: ContentBlock[];
  stage: ContentBlock[];
  actions: ContentBlock[];
  traditionalText: ContentBlock[];
  historicalContext: ContentBlock[];
  realityChecks: ContentBlock[];
  relationshipCurrentState: ContentBlock[];
  ethicsNotices: ContentBlock[];
}
```

伦理结果可以抑制内容、加入现实行动或把模式设为 `hard_stop`，但不得改变 `finalPalaceId`、六宫顺序、计算 trace 或三宫路径。

`hard_stop` 的 UI 顺序必须是现实安全行动优先。计算路径、trace、结构化详情、导出和保存只能放在默认关闭的“传统计算与技术记录（不作为当前现实行动依据）”披露区内。

## 6. 来源与版本

```ts
interface Provenance {
  knowledgeVersion: string;
  ruleVersion: string;
  schemaVersions: Record<string, string>;
  sourceIds: string[];
  provisionalSourceIds: string[];
  disputedFieldIds: string[];
  calendarPolicyId: string | null;
  algorithmId: string;
  methodId: string;
  methodVersion: string;
  methodSourceIds: string[];
  fragmentIds: string[];
  ethicsRuleIds: string[];
}
```

异文、试行来源和争议字段必须在结果或导出中可见，不得静默升级为校定原典。

## 7. 隐私与错误

- 不保存问题原文、身份字段或未声明的敏感信息。
- 导出默认移除精确本地时间；用户明确选择后才包含本次精确时间。
- 归档包装字段（方法、版本、主宫、三宫路径）必须与内部结果一致；无法验证时导入失败，不使用默认宫位。
- R4/R5 迁移只接受可验证的旧结构。R4 的扁平 `input` 必须从自身历法字段重建 `casting`，缺字段时拒绝导入。
- localStorage 不可用时，归档保存、导入、修改和删除必须明确失败或禁用，不得宣称已保存到本地。
- 错误不得回退到随机结果、默认宫位或不完整断语。
