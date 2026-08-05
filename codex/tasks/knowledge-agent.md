# Task: knowledge-agent

遵循 `codex/execution-first-policy.md`。

## 任务

让现有本地知识能够被应用加载并形成当前 MVP 所需的解释。

## 只读这些文件

- 本任务书
- `algorithm/interpretation-engine-contract.md`
- 当前使用的 palace、domain、fragment 与 source 数据
- 与这些数据直接对应的 Schema

不重新扫描和校勘全部来源。

## 完成项

- 本地知识加载
- palace、domain、stage 和 fragment 索引
- 六宫中性解释
- 领域与阶段片段选择
- 排序、去重和来源引用
- 缺失引用的 typed error

## 边界

- 不修改冻结算法
- 不自由生成断语
- 不把 provisional 升级为 canonical
- 不为 UI 美化删除异文或来源状态
- 只修复阻塞当前实现的真实数据错误

## 必要验证

- 六宫基础数据可加载
- 当前 MVP 使用的领域和片段引用有效
- 片段排序稳定
- 缺失引用会失败

不默认运行全库来源审计和全量文本扫描。

## 回报

只写完成项、未完成项、已知问题、运行命令和提交信息。
