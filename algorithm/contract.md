# 核心算法合同 v1.0.0

状态：`FROZEN-PROVISIONAL`

本合同冻结第一版传统起课核心。除非通过知识审查、测试审查和版本升级流程，不得修改计算含义。

## 1. 输入

传统推理机只接受已规范化的结构：

```ts
interface DivinationCoreInput {
  lunarMonth: number;          // 1..12
  lunarDay: number;            // 1..30，调用方必须先验证该月实际合法性
  earthlyBranchIndex: number;  // 子=1，丑=2，...，亥=12
}
```

禁止传入或使用：

- 性别
- 性取向
- 姓名
- 出生日期
- 问题类型
- 当前情绪
- 设备信息
- 任何随机种子

## 2. 六宫顺序

```text
index 0  大安  da_an
index 1  留连  liu_lian
index 2  速喜  su_xi
index 3  赤口  chi_kou
index 4  小吉  xiao_ji
index 5  空亡  kong_wang
```

顺序构成闭环，所有计数均为包含起点的顺数。

## 3. 逐步算法

```text
monthIndex = positiveMod(lunarMonth - 1, 6)
dayIndex   = positiveMod(monthIndex + lunarDay - 1, 6)
hourIndex  = positiveMod(dayIndex + earthlyBranchIndex - 1, 6)
```

其中：

```text
positiveMod(a, n) = ((a % n) + n) % n
```

第一版输入为正整数，仍要求实现 `positiveMod`，防止语言 `%` 语义差异污染未来扩展。

## 4. 压缩公式

仅用于一致性测试，不替代逐步 trace：

```text
hourIndex = positiveMod(lunarMonth + lunarDay + earthlyBranchIndex - 3, 6)
```

## 5. 输出

```ts
interface DivinationCoreResult {
  algorithmVersion: '1.0.0';
  month: PalaceStep;
  day: PalaceStep;
  hour: PalaceStep;
  finalPalaceId: PalaceId;
}

interface PalaceStep {
  stage: 'month' | 'day' | 'hour';
  startPalaceId: PalaceId;
  countValue: number;
  resultIndex: number;
  resultPalaceId: PalaceId;
  visitedPalaceIds: PalaceId[];
}
```

`visitedPalaceIds` 必须包含起点与终点。例如从速喜起初一，初一即为速喜，数组长度等于 `countValue`。

## 6. 基准案例

农历三月初五辰时：

```text
月：三月 → 速喜
日：速喜起初一，初五 → 大安
时：大安起子时，数至辰时 → 小吉
```

期望：

```json
{
  "monthPalaceId": "su_xi",
  "dayPalaceId": "da_an",
  "hourPalaceId": "xiao_ji",
  "finalPalaceId": "xiao_ji"
}
```

## 7. 输入校验

核心函数必须拒绝：

- 月份不在 1..12
- 日期不在 1..30
- 时辰序号不在 1..12
- 非整数
- `NaN`、`Infinity`
- 缺失字段

核心函数不负责判断某个农历月份是否真的有第三十日。该责任属于历法规范化层。

## 8. 闰月

传统核心只接收数值月份。闰月如何映射由 `calendarPolicyId` 决定。

第一版建议默认：

```text
leap-month-same-number-v1
闰月沿用其月序数，不额外加一，不把其视为第十三月。
```

这一策略属于暂定历法策略，不属于不可更改的数学核心。任何替代策略必须显式返回不同 `calendarPolicyId`。

## 9. 子时与换日

核心算法只接收规范化后的农历日与时辰序号。23:00 后是否换用次日农历日期由历法层处理。

不得在核心函数内部读取系统时间或自行判断早晚子时。

## 10. 不变量

必须满足：

1. 相同输入得到相同输出
2. 输出索引始终在 0..5
3. 月份增加 6，月宫相同
4. 日期增加 6，在输入合法范围内日宫相同
5. 时辰序号增加 6，最终宫位相同
6. 逐步算法与压缩公式一致
7. 改变身份字段不会影响结果，因为核心根本不接收身份字段

## 11. 变更流程

影响以下内容视为 breaking change：

- 六宫顺序
- 包含起点的计数规则
- 月、日、时公式
- 时辰序号定义
- 输出 trace 语义

必须：

- 新增算法版本
- 保留旧测试向量
- 撰写来源依据
- 由 `core-algorithm-agent` 与 `test-audit-agent` 双重审查
- 经人工批准后合并
