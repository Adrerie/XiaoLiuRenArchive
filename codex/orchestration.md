# Codex 子代理编排规范

Version: `2.0.0-execution-first`

本文件受 `codex/execution-first-policy.md` 约束。

## 1. 编排目标

多代理用于并行完成少量具体任务，不用于重复阅读、重复论证和重复审计。主代理统一接口、整合和提交。

## 2. 角色与任务

| 子代理 | 任务 | 主要区域 |
|---|---|---|
| `architecture-agent` | 建立脚手架、共享类型和应用服务边界 | 配置、`src/app/**`、`src/shared/**` |
| `calendar-agent` | 实现手动农历和一条公历转换路径 | `src/calendar/**` |
| `core-algorithm-agent` | 实现冻结算法和 trace | `src/core/**` |
| `knowledge-agent` | 加载知识并组装解释前半段 | `src/knowledge/**`、必要脚本 |
| `ethics-agent` | 实现关键伦理规则与 hard-stop | `src/ethics/**` |
| `frontend-agent` | 实现输入和结果界面 | `src/components/**`、`src/pages/**` |
| `test-audit-agent` | 整合后运行必要验证 | 少量测试与验证修正 |

每个代理只读取自己的任务书和直接依赖文件。

## 3. 推荐并行方式

```text
architecture-agent
  ├─ core-algorithm-agent
  ├─ calendar-agent
  ├─ knowledge-agent
  ├─ ethics-agent
  └─ frontend-agent
          ↓
      主代理整合
          ↓
  test-audit-agent 必要检查
          ↓
        实现 PR
```

允许并行：

- core 与 calendar
- knowledge 与 ethics
- frontend 静态界面与底层实现

不要求每个代理建立完整独立审计链。可使用 branch 或 worktree，但不要为了形式增加无必要的分支和合并步骤。

## 4. 接口协调

architecture-agent 先给出最小共享接口：

- `DivinationRequest`
- `NormalizedLunarInput`
- `CalculationResult`
- `InterpretationDraft`
- `EthicsEvaluationResult`
- `DivinationResult`

接口满足当前 MVP 即可。出现真实 breaking change 时由主代理通知相关代理，不要求全体重新阅读项目。

## 5. 实现顺序

```text
1. 脚手架与共享类型
2. 核心算法与手动农历
3. 知识加载和解释
4. 伦理规则
5. runDivination 应用服务
6. 可操作 UI
7. 公历转换路径
8. 必要测试与修正
9. PR
```

## 6. 验证分工

各实现代理只运行与自己模块直接相关的测试。

整合后由 test-audit-agent 一次性确认：

- build 或 typecheck
- 核心算法基准案例
- 关键伦理守卫
- 手动农历主流程
- 一次移动端和一次桌面端实测

已经通过的模块不重复验证。失败时只返回所属代理修正对应模块。

## 7. 禁止事项

- 每个代理全仓扫描
- 多人重复实现同一功能
- 多人重复运行相同验证
- 为过程留痕生成大量报告文件
- 整合失败后回头重新审查全部架构
- 在没有真实阻塞冲突时暂停实现并重新规划

## 8. 子代理回报

每个代理只向主代理返回：

```text
完成项
未完成项
已知问题
实际运行的命令
提交或分支信息
```

不要求单独创建报告文件。

## 9. 冲突升级

只有以下情况需要主代理或人工决定：

- 冻结算法或宫序可能改变
- 公共接口存在无法兼容的冲突
- 传统异文需要选择
- 安全规则与现实行动发生实质争议
- 远程服务或新流派被提议加入

其他问题在所属模块内解决。
