# ADR 0003: Civil Midnight as the Default Date Boundary

Status: Accepted, Provisional

## Context

子时换日存在不同传统与现代实践。部分体系在 23:00 换日，部分使用民用午夜，另有早子时与晚子时分法。隐藏这一差异会使相同时间在不同软件中得到不同农历日和落宫。

## Decision

R1 默认公历输入采用民用午夜换日策略。23:00 子初换日作为可选择的独立 `calendarPolicyId` 保留。

界面必须显示当前策略，并提示切换策略可能改变结果。手动农历输入不推断换日边界。

## Reasons

- 与一般用户民用日期直觉一致
- 减少首次使用中的隐性日期跳转
- 争议策略仍可显式选择和比较
- 不把版本争议埋入代码常量

## Consequences

- 23:00 至 23:59 在不同策略下可能产生不同结果
- 测试必须覆盖策略差异
- 结果必须记录 `calendarPolicyId`
- 若后续版本更改默认值，需要新的 ADR 和迁移说明
