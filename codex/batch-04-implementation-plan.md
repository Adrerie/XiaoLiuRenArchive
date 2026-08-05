# Batch 04 Implementation Plan

Status: `EXECUTION-FIRST-ACTIVE-CONTROLLER`

本计划是 R1 Local Web MVP 的直接执行计划。详细默认规则见 `codex/execution-first-policy.md` 和 `codex/orchestration.md`。

## 1. 目标

尽快形成可操作闭环：

```text
输入
→ 历法规范化
→ 冻结算法
→ 本地知识解释
→ 伦理规则
→ 结构化结果
→ Web 界面
```

## 2. 启动与工作区

主代理快速阅读入口文件后立即开始实现。

默认使用一个 feature 分支和一个共享工作区。只有主代理执行 Git 操作。子代理不得切换分支、提交、cherry-pick 或在他人目录创建占位文件。

## 3. 主代理工作包

主代理不是纯调度员，负责持续完成：

- `src/shared/**` 与 `src/types/**` 的最小共享接口
- typed errors
- `src/app/**` 与 `runDivination`
- 模块导出和根级入口
- 表单请求适配与结果接线
- 子模块逐个接入
- 增量 build、冲突处理和里程碑提交

分配子代理后立即执行上述任务。一个模块返回后立刻接入，不等待其他模块。

## 4. 子代理工作包

### A. 工程配置

负责人：`architecture-agent`

只完成：

- React、TypeScript strict、Vite
- Vitest
- `package.json` 与必要配置
- 基础目录和构建脚本

不得创建业务模块占位文件，不负责共享业务类型和 `runDivination`。

### B. 核心算法

负责人：`core-algorithm-agent`

完成：

- 六宫常量
- 月、日、时纯函数
- 完整 trace
- 基准案例和必要核心测试

只修改 `src/core/**` 及对应测试。

### C. 历法

负责人：`calendar-agent`

完成：

- 手动农历适配
- 十二时辰映射
- 一条公历与 IANA 时区转换路径
- 当前默认策略和 typed errors

只修改 `src/calendar/**` 及对应测试。

### D. 知识与解释

负责人：`knowledge-agent`

完成：

- 加载现有知识数据
- 六宫中性解释
- 领域和阶段解释
- 片段排序、去重与来源引用

只处理当前 MVP 使用的数据，不做全库重新校勘。

### E. 伦理规则

负责人：`ethics-agent`

完成关键场景：

- 明确拒绝
- 第三方身份
- 健康非诊断
- 财务非依赖
- 失联危险 hard-stop
- 落宫不变

### F. 前端

负责人：`frontend-agent`

完成：

- 手动农历输入组件
- 领域和阶段选择
- 结果总览
- trace
- 现代解释
- 原典和来源
- hard-stop 展示
- 移动端布局

frontend-agent 不修改 `src/app/**`、共享类型或算法目录。主代理负责页面与应用服务接线。

### G. 必要整合验证

负责人：`test-audit-agent`

在手动农历主流程已经可操作后，只确认：

- build 或 typecheck
- 三月初五辰时小吉
- 身份不影响落宫
- 五个关键伦理场景
- 手动农历主流程
- 移动端和桌面端代表性截图

不进行全仓回溯和长篇独立审计。

## 5. 并行调度

```text
主代理：共享类型 + app 服务 + 持续整合
architecture-agent：配置
core-agent + calendar-agent：底层模块
knowledge-agent + ethics-agent：解释模块
frontend-agent：组件和页面
```

子代理完成顺序不重要。谁先完成，主代理先接入谁。

禁止：

- 主代理只等待或轮询状态
- 子代理各自提交后再批量 cherry-pick
- 多个代理修改同一文件
- architecture-agent 写入 `src/core/**` 等他人目录
- 为解决局部冲突重置整个工作区

## 6. 整合顺序

```text
配置与共享接口并行
→ 核心算法与手动农历接入
→ 知识与伦理接入
→ UI 接线
→ 手动农历完整闭环
→ 公历转换
→ 必要验证
→ 修正
→ PR
```

已完成阶段不为验证完整性重新执行。失败时只修对应模块。

## 7. 默认不做

- 全仓重复调研
- 重新论证已确认架构
- 大篇幅审计和证据链
- 每个代理单独生成总结文件
- 全量测试矩阵
- 复杂动画、账号、云同步、社区、付费、Android 发布和完整 PDF 导出

## 8. 必要命令

项目至少提供：

```bash
npm run dev
npm run build
npm test
npm run test:core
npm run test:ethics
```

## 9. 第一里程碑

用户能够：

1. 打开本地 Web 应用
2. 输入农历月、日、时辰
3. 选择问事领域
4. 得到正确宫位和 trace
5. 查看现代解释、原典与来源
6. 在关键风险场景看到正确伦理提示

## 10. 最终报告

主代理只报告：

- 完成项
- 未完成项
- 已知问题
- 实际运行的必要命令
- 提交、分支和 PR 信息
- 代表性截图
