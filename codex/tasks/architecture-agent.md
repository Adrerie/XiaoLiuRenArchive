# Task: architecture-agent

遵循 `codex/execution-first-policy.md`。

## 任务

只建立 R1 工程配置和脚手架。共享业务类型、应用服务和模块整合由主代理负责。

## 只读这些文件

- 本任务书
- `docs/10-product-requirements.md`
- `docs/11-ui-information-architecture.md`

不扫描整个仓库。

## 只完成

- React、TypeScript strict、Vite
- Vitest
- `package.json`
- TypeScript、Vite、Vitest 配置
- `index.html` 和最小启动配置
- 必要依赖安装
- 空目录可由主代理建立

## 写入范围

- 根级配置文件
- `package.json` 与锁文件
- 构建和测试配置

## 禁止

- 不修改 `src/core/**`
- 不修改 `src/calendar/**`
- 不修改 `src/knowledge/**`
- 不修改 `src/ethics/**`
- 不创建上述目录的 `index.ts` 或占位实现
- 不定义共享业务类型
- 不实现 `runDivination`
- 不执行 Git 切换、提交或 cherry-pick
- 不修改冻结算法、知识或伦理语义

## 必要验证

```text
依赖安装成功
配置可被 typecheck 或 build 读取
```

## 回报

只写完成项、未完成项、已知问题、运行命令和修改路径。
