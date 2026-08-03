# 历法规范化策略 v1

状态：`PROVISIONAL`

本文件规定如何把用户输入的公历时间或手动农历信息转换为核心算法需要的农历月、农历日和十二时辰序号。历法规范化层与传统起课核心必须分离。

## 1. 输出合同

```ts
interface NormalizedDivinationTime {
  source: 'gregorian_datetime' | 'manual_lunar';
  timeZone: string;
  localDateTime?: string;
  lunarYear?: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  earthlyBranch: '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
  earthlyBranchIndex: number;
  calendarPolicyId: string;
  libraryId?: string;
  libraryVersion?: string;
  warnings: string[];
}
```

核心算法只能接收：

- `lunarMonth`
- `lunarDay`
- `earthlyBranchIndex`

其他字段用于解释、审计与复现。

## 2. 时区

- 公历日期时间必须携带 IANA 时区，例如 `Asia/Shanghai`、`America/Los_Angeles`。
- 禁止仅依赖设备当前时区而不在结果中记录。
- 用户手动输入农历月日与时辰时，可不做时区转换，但仍应记录输入模式。
- 夏令时由标准时区库处理，不自行维护固定偏移表。

## 3. 十二时辰映射

第一版采用当地民用时钟：

```text
子 23:00:00–00:59:59  index 1
丑 01:00:00–02:59:59  index 2
寅 03:00:00–04:59:59  index 3
卯 05:00:00–06:59:59  index 4
辰 07:00:00–08:59:59  index 5
巳 09:00:00–10:59:59  index 6
午 11:00:00–12:59:59  index 7
未 13:00:00–14:59:59  index 8
申 15:00:00–16:59:59  index 9
酉 17:00:00–18:59:59  index 10
戌 19:00:00–20:59:59  index 11
亥 21:00:00–22:59:59  index 12
```

边界测试必须覆盖每个时辰的起点前一秒、起点和终点。

## 4. 子时换日策略

传统实践中存在 23:00 换日、00:00 换日以及早晚子时等不同处理。第一版不得假装不存在争议。

默认策略：

```text
calendarPolicyId = civil-day-midnight-v1
```

规则：

- 23:00–23:59 属子时
- 农历日期仍采用当地民用日期所对应的农历日
- 00:00 起进入下一民用日及其农历日期

候选扩展策略：

```text
zi-hour-next-day-v1
23:00 起按次日农历日期起课
```

```text
split-zi-hour-v1
23:00–23:59 为晚子时，00:00–00:59 为早子时，日期处理可配置
```

候选策略未通过知识审查前不得成为默认值。

## 5. 闰月策略

默认策略：

```text
leap-month-same-number-v1
```

闰某月仍以该月数字起课。例如闰二月的 `lunarMonth` 为 2，另以 `isLeapMonth=true` 记录。

禁止：

- 把闰月自动视为第十三月
- 在核心算法内自行决定闰月规则
- 隐藏用户正在使用的闰月策略

后续若发现可靠传统版本采用不同规则，应新增策略 ID，不覆盖旧策略。

## 6. 手动农历输入

手动输入必须验证：

- 月为 1..12
- 日为 1..30
- 时辰为十二支之一
- 若提供农历年份，应使用历法库验证该月是否存在、是否为闰月以及日期是否合法
- 若未提供年份，系统只能进行数学起课，必须标注 `calendar-validation-limited`

## 7. 历法库

建议第一版使用固定版本的 `lunar-javascript`，但必须通过适配器封装：

```ts
interface CalendarAdapter {
  id: string;
  version: string;
  fromGregorian(input: ZonedDateTimeInput, policy: CalendarPolicy): NormalizedDivinationTime;
  validateManualLunar(input: ManualLunarInput): ValidationResult;
}
```

业务代码不得在多个组件中直接调用第三方历法库。

升级历法库时必须运行固定日期回归集，并在 PR 中报告差异。

## 8. 不支持与错误

以下情况应返回结构化错误而不是猜测：

- 日期超出历法库支持范围
- IANA 时区无效
- 当地时间因夏令时跳跃而不存在
- 当地时间因夏令时回拨而歧义且未指定偏移
- 手动农历日期不合法
- 时辰与具体时钟时间相互矛盾

建议错误结构：

```ts
interface CalendarNormalizationError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestedAction?: string;
}
```

## 9. 审计字段

每次排盘至少保存：

- 原始输入
- IANA 时区
- 规范化当地时间
- 农历月日
- 是否闰月
- 时辰及序号
- `calendarPolicyId`
- 历法库 ID 与版本

这些字段默认只在本地存在。导出时由用户选择是否包含精确时间与地点信息。
