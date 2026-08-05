# Task: ethics-agent

遵循 `codex/execution-first-policy.md`。

## 任务

实现当前 MVP 的关键伦理守卫，不扩展全部可能规则。

## 只读这些文件

- 本任务书
- `algorithm/ethics-engine-contract.md`
- `knowledge/ethics-rules.v1.json`
- `knowledge/safety-messages.v1.json`
- 当前关键伦理案例

## 完成项

- 稳定规则排序
- 必要条件与 effect
- claim 抑制
- 受控结论和现实行动
- hard-block 与 hard-stop
- 落宫不变

## 必须覆盖

- 明确拒绝
- 第三方身份
- 健康非诊断
- 财务非依赖
- 人员失联危险

## 边界

- 不修改宫位和 trace
- 不从自由文本推断敏感事实
- 不自由生成安全文案
- 不强制同性关系进入夫位、妻位或攻受阴阳

## 必要验证

只运行上述五个场景和落宫不变量。其他红队案例在相关规则变化或正式发布前再运行。

## 回报

只写完成项、未完成项、已知问题、运行命令和提交信息。
