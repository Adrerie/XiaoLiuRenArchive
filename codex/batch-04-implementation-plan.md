# Batch 04 Implementation Plan

Status: `EXECUTION-FIRST`

本计划是 R1 Local Web MVP 的直接执行计划。详细默认规则见 `codex/execution-first-policy.md`。

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

## 2. 主代理启动

主代理快速阅读：

- `README.md`
- `AGENTS.md`
- `CODEX_MASTER_PROMPT.md`
- `codex/execution-first-policy.md`
- 本计划
- `codex/batch-04-acceptance-criteria.md`

随后立即分配任务。子代理不重复阅读以上全部文件，只读取自己的任务书和直接依赖。

## 3. 工作包

### A. 工程骨架

负责人：`architecture-agent`

完成：

- React、TypeScript strict、Vite
- Vitest
- 最小共享类型
- `runDivination` 服务边界
- 必要构建脚本

### B. 核心算法

负责人：`core-algorithm-agent`

完成：

- 六宫常量
- 月、日、时纯函数
- 完整 trace
- 基准案例和必要核心测试

### C. 历法

负责人：`calendar-agent`

完成：

- 手动农历适配
- 十二时辰映射
- 一条公历与 IANA 时区转换路径
- 当前默认策略和 typed errors

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

- 手动农历输入
- 领域和阶段选择
- 结果总览
- trace
- 现代解释
- 原典和来源
- hard-stop 展示
- 移动端布局

### G. 必要整合验证

负责人：`test-audit-agent`

只确认：

- build 或 typecheck
- 三月初五辰时小吉
- 身份不影响落宫
- 五个关键伦理场景
- 手动农历主流程
- 移动端和桌面端代表性截图

不进行全仓回溯和长篇独立审计。

## 4. 整合顺序

```text
脚手架
→ 核心算法与手动农历
→ 知识和伦理
→ 应用服务
→ UI
→ 公历转换
→ 必要验证
→ 修正
→ PR
```

已完成阶段不为验证完整性重新执行。失败时只修对应模块。

## 5. 默认不做

- 全仓重复调研
- 重新论证已确认架构
- 大篇幅审计和证据链
- 每个代理单独生成总结文件
- 全量测试矩阵
- 复杂动画、账号、云同步、社区、付费、Android 发布和完整 PDF 导出

## 6. 必要命令

项目至少提供：

```bash
npm run dev
npm run build
npm test
npm run test:core
npm run test:ethics
```

其他校验命令可在对应结构实际变更时补充，不阻塞第一版可操作界面。

## 7. 第一里程碑

用户能够：

1. 打开本地 Web 应用
2. 输入农历月、日、时辰
3. 选择问事领域
4. 得到正确宫位和 trace
5. 查看现代解释、原典与来源
6. 在关键风险场景看到正确伦理提示

## 8. 最终报告

主代理只报告：

- 完成项
- 未完成项
- 已知问题
- 实际运行的必要命令
- 提交、分支和 PR 信息
- 代表性截图
