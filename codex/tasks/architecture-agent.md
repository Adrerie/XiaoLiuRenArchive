# Task: architecture-agent

遵循 `codex/execution-first-policy.md`。

## 任务

建立 R1 工程骨架和最小共享接口，让其他代理立即并行开发。

## 只读这些文件

- 本任务书
- `docs/10-product-requirements.md`
- `docs/11-ui-information-architecture.md`
- request 与 result Schema

不扫描整个仓库。

## 完成项

- React、TypeScript strict、Vite
- Vitest 与基础构建脚本
- 最小共享类型
- `runDivination` 服务接口
- 清晰的模块目录
- 必要依赖安装

## 边界

- 不修改冻结算法
- 不改知识与伦理语义
- 不在应用服务中复制落宫逻辑
- 不为形式生成依赖图、长 ADR 或架构报告

## 必要验证

```text
typecheck 或 build
```

## 回报

只写完成项、未完成项、已知问题、运行命令和提交信息。
