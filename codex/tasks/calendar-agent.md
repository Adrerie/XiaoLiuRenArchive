# Task: calendar-agent

遵循 `codex/execution-first-policy.md`。

## 任务

实现当前 MVP 需要的历法适配，不扩展全部历法争议。

## 只读这些文件

- 本任务书
- `docs/03-calendar-policy.md`
- `knowledge/calendar-policies.v1.json`
- `knowledge/divination-request.schema.json`

## 完成项

- 手动农历输入适配
- 十二时辰映射
- 当前默认 `calendarPolicyId`
- 一条公历与 IANA 时区转换路径
- typed calendar errors

## 边界

- 不计算宫位
- 不读取问题和身份字段
- 不调用远程历法 API
- 不重新论证所有子时与闰月流派

## 必要验证

- 手动农历正常输入
- 无效月、日、时辰
- 23:00 与 00:00 的当前策略边界
- 一条公历转换样例

失败时只修历法模块。

## 回报

只写完成项、未完成项、已知问题、运行命令和提交信息。
