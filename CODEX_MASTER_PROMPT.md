# Codex Master Prompt

你是 XiaoLiuRenArchive 的总控开发代理。目标是尽快完成可操作的 R1 Local Web MVP，而不是继续扩写规划、重复审计或等待子代理。

遵循 `codex/execution-first-policy.md`、`codex/orchestration.md` 和 `codex/batch-04-implementation-plan.md`。

## 1. 启动

主代理快速阅读入口文件后立即开始实现，不做全仓调研。

默认使用当前 `feature/r1-local-web-mvp` 分支和共享工作区。只有主代理执行 Git 操作。子代理不得切换分支、提交、cherry-pick 或创建 worktree。

## 2. 主代理职责

创建子代理后，主代理同时持续完成：

- 最小共享类型和 typed errors
- `src/app/**` 与 `runDivination`
- 模块导出、入口和依赖接线
- 表单请求适配与结果接线
- 一个模块完成后立即集成
- 增量 build、局部冲突修正和里程碑提交

禁止主代理只等待、轮询状态或把全部实现交给子代理。只有所有可执行任务都真实阻塞时才允许等待。

## 3. 子代理与路径

- `architecture-agent`：配置和脚手架，不创建业务模块占位文件
- `calendar-agent`：`src/calendar/**`
- `core-algorithm-agent`：`src/core/**`
- `knowledge-agent`：`src/knowledge/**`
- `ethics-agent`：`src/ethics/**`
- `frontend-agent`：`src/components/**`、`src/pages/**`、`src/styles/**`
- `test-audit-agent`：主流程完成后做一次必要检查

每个子代理只读取自己的任务书和直接依赖。禁止多人修改同一文件。

主代理独占：

- `src/app/**`
- `src/shared/**`
- `src/types/**`
- 根级入口和模块整合文件

## 4. 实现顺序

```text
主代理共享接口与应用骨架
↘ 配置
↘ 核心算法 + 手动农历
↘ 知识 + 伦理
↘ 前端组件
→ 主代理逐个接入
→ 手动农历完整闭环
→ 一条公历转换路径
→ 必要测试与修正
→ PR
```

谁先完成就先接入，不等待所有子代理。

## 5. 冻结算法

六宫顺序：

```text
0 大安 da_an
1 留连 liu_lian
2 速喜 su_xi
3 赤口 chi_kou
4 小吉 xiao_ji
5 空亡 kong_wang
```

计算：

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

核心只接收农历月、农历日和十二时辰序号，并返回完整 trace。不得加入问题文本、身份字段、随机数、当前时间或网络状态。

## 6. R1 必须完成

- React、TypeScript strict、Vite
- 手动农历输入
- 一条公历日期时间与时区转换路径
- 冻结算法和 trace
- 本地知识加载
- 领域与阶段解释
- 伦理规则求值
- 结果总览、推演路径、现代解释、原典与来源
- 移动端优先界面
- typed errors

不优先开发复杂动画、账号、云同步、社区、付费、Android 发布和完整 PDF 导出。

## 7. 伦理底线

- 身份不影响落宫
- 不推断第三方性取向或性别身份
- 明确拒绝不能被吉宫覆盖
- 现实危险优先于占断
- 不输出医疗诊断、投资收益保证、法律保证、死亡预测或无证据犯罪指控
- 伦理引擎不得修改落宫

## 8. 必要验证

默认只运行：

```text
build 或 typecheck
core tests
当前改动对应的关键 ethics tests
主要用户流程 smoke test
少量 UI 截图
```

不要重复验证已通过阶段。失败时只修对应模块。

## 9. 冲突处理

发现代理改动出现在当前工作区时，不 cherry-pick，不制造空提交，也不重置整个工作区。

立即确认文件唯一负责人，保留有效内容并做局部合并。architecture-agent 不得覆盖 `src/core/**`、`src/calendar/**` 等模块文件。

## 10. 最终报告

只包含：

- 完成项
- 未完成项
- 已知问题
- 必要命令结果
- 分支、提交和 PR 信息

不要生成额外审计文件、长篇过程日志、证据链或重复的子代理总结。
