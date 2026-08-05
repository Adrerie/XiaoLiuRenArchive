# R1 PR #5 Final Fix Plan

Status: `EXECUTION-FIRST-TARGETED-FIX`

本轮只关闭 PR #5 剩余的两个问题：领域解释进入伦理处理链，以及实现分支同步最新 `main`。不得重新审查核心算法、历法实现或已通过的 Schema 修正。

## 1. 同步基线

当前分支必须为 `feature/r1-local-web-mvp`，工作区必须干净。

先获取并合并最新 `origin/main`：

```bash
git fetch origin --prune
git merge --no-edit origin/main
```

若冲突仅发生在 `CODEX_MASTER_PROMPT.md` 或 `codex/**`，采用 `origin/main` 的最新计划与执行规则。若冲突涉及 `src/**`、`knowledge/**`、`package.json` 或测试代码，立即停止并报告，不得重置工作区或大范围重写。

## 2. 领域解释进入伦理链

只修改与解释组装、伦理呈现及对应测试直接相关的文件。

必须满足：

- `question-domains.v1.json` 产生的 `summary`、`supportive`、`caution`、`actionPrompts` 在伦理执行前具有稳定 ID，并能被规则追踪、保留或阻止。
- 不允许领域文本绕过 Candidate Claim 或等价的受控过滤层直接进入最终展示。
- 明确拒绝触发 `consent-overrides-divination` 时，任何暗示关系继续推进、等待会成功、吉宫能够覆盖拒绝的领域总结、支持性表述或行动提示均不得显示。
- 中性宫位、现实边界提示、必要 caution、计算结果和 trace 可以保留。
- `hard_block` 后的 `interpretation.fragmentIds`、`ethics.retainedFragmentIds`、来源和最终展示必须一致。
- 不使用临时关键词搜索、文本字符串硬编码或 UI 单独隐藏来替代结构化伦理处理。

实现可以扩展领域块的 claim/tag 元数据，或采用等价的稳定结构化机制。不得修改冻结算法。

## 3. 定向测试

新增或调整测试，至少覆盖：

```text
农历三月初五辰时
关系领域
明确拒绝 = true
最终宫位 = xiao_ji
```

断言：

- `finalPalaceId` 仍为 `xiao_ji`
- 命中 `consent-overrides-divination`
- 拒绝优先提示存在
- 冲突的关系推进类领域文本和行动提示不在最终 sections
- 被保留的 fragment/claim ID 与最终展示一致
- 最终结果仍符合 `divination-result.schema.json`

只运行：

```bash
npm run typecheck
npm run build
npm test
```

失败时只追查解释、伦理呈现或分支同步对应模块。不重新运行核心算法全量枚举，不做全仓审计，不新增截图，除非界面展示逻辑实际改变且现有截图无法代表结果。

## 4. 提交与 PR

完成后：

1. 提交本轮修改。
2. 推送 `feature/r1-local-web-mvp`。
3. 更新现有 PR #5，不创建新实现 PR。
4. PR 描述补充本轮完成项和三个实际命令结果。
5. 确认 PR 面向 `main` 且恢复可合并状态。
6. 不得自行合并 PR。

最终只报告：完成项、未完成项、已知问题、测试结果、提交 SHA、PR 链接和可合并状态。
