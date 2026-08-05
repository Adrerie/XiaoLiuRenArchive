# Codex 子代理编排规范

Version: `2.1.0-active-controller`

本文件受 `codex/execution-first-policy.md` 约束。

## 1. 编排目标

多代理用于并行完成少量具体任务。主代理同时承担实际开发、接口维护和持续整合，不得在子代理运行期间空等。

## 2. 默认工作模式

Codex 子代理可能共享同一工作区，因此默认使用：

```text
一个 feature 分支
一个共享工作区
主代理独占 Git 操作
子代理按路径并行写入
```

子代理不得执行 `git switch`、`commit`、`merge`、`cherry-pick` 或创建 worktree。主代理按可运行里程碑统一提交。

## 3. 路径所有权

| 负责人 | 写入范围 |
|---|---|
| 主代理 | `src/app/**`、`src/shared/**`、`src/types/**`、根级入口、模块导出与整合文件 |
| `architecture-agent` | `package.json`、TypeScript/Vite/Vitest 配置、基础目录与构建脚本 |
| `calendar-agent` | `src/calendar/**`、对应测试 |
| `core-algorithm-agent` | `src/core/**`、对应测试 |
| `knowledge-agent` | `src/knowledge/**`、必要知识加载脚本 |
| `ethics-agent` | `src/ethics/**`、对应测试 |
| `frontend-agent` | `src/components/**`、`src/pages/**`、`src/styles/**` |
| `test-audit-agent` | 少量整合测试与验证修正 |

任何代理不得在他人目录创建占位实现。architecture-agent 尤其不得创建 `src/core/index.ts`、`src/calendar/index.ts` 等模块占位文件。

## 4. 主代理活跃任务线

分配子代理后，主代理立即执行：

1. 定义最小共享类型和 typed errors。
2. 建立 `runDivination` 应用服务骨架。
3. 建立模块导出和依赖接线。
4. 接入已完成模块，不等待其他模块全部结束。
5. 处理跨模块适配、表单到请求的转换和结果到 UI 的连接。
6. 持续运行增量 build 或 typecheck，修正当前整合问题。
7. 在形成可运行里程碑后统一提交。

主代理不得只轮询子代理状态。没有整合任务时，应处理当前未被分配的实际实现，例如错误展示、路由、应用状态和页面接线。

## 5. 子代理任务

- `architecture-agent`：仅处理工程配置和脚手架，不定义业务模块内容。
- `core-algorithm-agent`：冻结算法和 trace。
- `calendar-agent`：手动农历和一条公历转换路径。
- `knowledge-agent`：知识加载和解释前半段。
- `ethics-agent`：关键伦理规则和 hard-stop。
- `frontend-agent`：输入与结果组件。
- `test-audit-agent`：主流程完成后做一次必要检查。

每个子代理只读取自己的任务书和直接依赖。

## 6. 并行与整合

允许并行：

- architecture、core、calendar
- knowledge、ethics
- frontend 静态界面与主代理应用服务

一个子代理返回后，主代理立即检查其路径并接入。不得等待所有子代理完成后一次性 cherry-pick。

若发现同文件冲突：

1. 立即停止双方继续修改该文件。
2. 指定唯一负责人。
3. 保留当前有效内容并做局部合并。
4. 只修复对应模块，不重置或回滚整个工作区。

## 7. 实现顺序

```text
主代理共享接口与应用骨架
↘ architecture 配置
↘ core + calendar
↘ knowledge + ethics
↘ frontend
→ 主代理持续接入
→ 手动农历完整闭环
→ 公历路径
→ 必要验证
→ 提交与 PR
```

## 8. 必要验证

各代理只运行本模块测试。整合后只确认：

- build 或 typecheck
- 三月初五辰时小吉
- 身份不影响落宫
- 明确拒绝、第三方身份、健康、财务、失联危险
- 手动农历主流程
- 移动端与桌面端代表性截图

失败时返回唯一所属模块修正，不重新审查全部架构。

## 9. 回报格式

子代理只返回：

```text
完成项
未完成项
已知问题
实际运行的命令
修改的路径
```

不提交分支，不生成报告文件。
