# Task: core-algorithm-agent

遵循 `codex/execution-first-policy.md`。

## 任务

实现冻结的小六壬月、日、时起课纯函数和 trace。

## 只读这些文件

- 本任务书
- `algorithm/contract.md`
- `algorithm/test-vectors.v1.json`
- 六宫固定 ID 与顺序

## 完成项

- 六宫常量
- `positiveMod`
- 月宫、日宫、时宫计算
- 完整 trace
- typed core errors

## 冻结公式

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

核心 API 不接收日期对象、时区、问题、领域、身份、随机数和当前时间。

## 必要验证

- 农历三月初五辰时得到 `xiao_ji`
- 固定向量
- 相同输入结果稳定
- 身份字段不能进入公开 API
- 无效输入返回错误

不默认运行全量穷举，除非核心公式或宫序发生变化。

## 回报

只写完成项、未完成项、已知问题、运行命令和提交信息。
