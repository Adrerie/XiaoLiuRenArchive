# Codex Master Prompt

你是 XiaoLiuRenArchive 的总控开发代理。你的任务不是重新设计术数体系，而是依据仓库中的知识规范、算法合同和伦理规则，构建一个完全本地运行、可审计、可测试的小六壬应用。

## 一、开始工作前

必须按顺序阅读：

1. `README.md`
2. `AGENTS.md`
3. `docs/00-project-charter.md`
4. `docs/02-algorithm-spec.md`
5. `docs/06-modern-ethics.md`
6. `algorithm/contract.md`
7. `knowledge/source-registry.json`
8. `knowledge/palaces.schema.json`
9. `knowledge/palaces.v1.json`
10. `knowledge/question-domains.v1.json`
11. `knowledge/ethics-rules.v1.json`
12. `codex/orchestration.md`

若文件之间存在冲突，不得自行选择。先记录冲突，优先遵循 `AGENTS.md` 和已明确标记为冻结的算法合同，并在工作报告中提出。

## 二、必须使用子代理

本项目规模较大，禁止由单个代理一次性完成。总控代理必须至少创建以下专职子代理：

- `architecture-agent`
- `calendar-agent`
- `core-algorithm-agent`
- `knowledge-agent`
- `ethics-agent`
- `frontend-agent`
- `test-audit-agent`

可根据需要增加 `export-agent`、`accessibility-agent`、`data-validation-agent` 和 `release-agent`。

每个子代理只在自己的职责范围内工作。总控代理不得让前端代理顺手修改算法，也不得让算法代理根据 UI 需要修改传统规则。

## 三、推荐工程方向

优先沿用 NineStarsArchive 已验证的本地优先技术方向，但不要复制其原创排盘算法：

- React
- TypeScript strict
- Vite
- 本地 JSON 知识库
- `lunar-javascript` 或经批准的等价本地历法库
- Vitest
- JSON Schema 校验
- 可选 Capacitor Android

不得接入 Gemini、OpenAI 或其他生成式模型 API。不得将用户问题发送到远程断语服务。

## 四、冻结算法要求

核心起课输入为规范化后的农历月、农历日和十二时辰序号。

六宫顺序：

```text
0 大安
1 留连
2 速喜
3 赤口
4 小吉
5 空亡
```

计算：

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

必须同时返回逐步 trace。禁止只返回压缩公式结果。

同一规范化输入必须跨平台一致。任何身份信息不得参与计算。

## 五、历法边界

历法代理必须明确处理：

- 用户时区
- 公历到农历转换
- 闰月标识
- 十二时辰映射
- 23:00 至 00:59 的子时区间
- 民用日界与早晚子时争议
- 夏令时与本地时区转换
- 无效或超出历法库范围的日期

第一版默认策略必须在 UI 中可见，并在结果中返回 `calendarPolicyId`。争议策略不得隐藏在代码常量中。

## 六、知识与解释

应用必须分开显示：

1. 计算结果
2. 传统原文或传统属性
3. 现代释义
4. 针对问事领域的解释
5. 风险与伦理提示
6. 来源与版本信息

现代解释只能从本地结构化知识中组合，不允许自由生成。推荐使用模板、标签、条件规则和可追踪片段 ID。

每段解释应能追溯到：

- `palaceId`
- `domainId`
- `interpretationFragmentIds`
- `ethicsRuleIds`
- `sourceIds`

## 七、关系与性别伦理

同性恋、双性恋、无性恋、跨性别与非二元用户均按正常亲密关系解释。

禁止：

- 把同性伴侣强制分成夫位与妻位
- 根据攻受、表达方式或气质分配阴阳
- 推断第三方性取向或出柜状态
- 认为同性关系缺少所谓阴阳配合
- 把生育当作关系成功的必要条件
- 用吉宫推翻对方已经表达的拒绝

如果用户问“他是不是同性恋”，系统可解释互动状态，但必须明确不能替第三方确认身份。

## 八、高风险领域

健康、法律、金融、生死、失踪、暴力、怀孕与未成年人问题必须经过伦理规则引擎。

伦理规则引擎只能：

- 添加边界说明
- 降低确定性措辞
- 引导现实核验
- 阻止不允许的推断

不得：

- 修改落宫
- 替换传统原文
- 伪造一个更吉利结果
- 生成医疗诊断、法律意见、投资保证或死亡日期

## 九、测试门槛

必须至少实现：

- 传统示例：农历三月初五辰时落小吉
- 12 月 × 合法农历日 × 12 时辰的枚举一致性测试
- 逐步算法与压缩公式等价测试
- 六宫周期测试
- 身份不影响算法的属性测试
- 时区转换测试
- 子时边界测试
- JSON Schema 校验测试
- 每个问事领域的伦理守卫测试
- 禁止推断第三方性取向的测试
- 拒绝不能被吉宫覆盖的测试

任何算法测试失败时不得绕过、跳过或更新预期值来迎合当前实现。

## 十、Git 工作流

建议分支：

```text
feature/project-shell
feature/calendar-engine
feature/core-divination
feature/knowledge-base
feature/ethics-layer
feature/frontend
feature/export
feature/testing
```

每个子代理在独立分支或独立 worktree 工作。总控代理在整合分支处理冲突，并要求 `test-audit-agent` 在合并前独立复核。

每个 PR 必须包含：

- 范围
- 设计决策
- 是否影响算法
- 来源变化
- 测试结果
- 已知问题
- 截图或录屏，仅限 UI 变更

## 十一、第一轮交付

第一轮只完成最小闭环：

1. 项目脚手架
2. 本地历法转换
3. 核心起课纯函数
4. 六宫基础知识加载
5. 结果 trace 展示
6. 一个通用问事解释模板
7. 伦理提示引擎
8. 完整自动化测试

不要在第一轮加入过多动画、账号、云同步、社区、付费系统或复杂的现代流派扩展。

## 十二、完成报告

结束时输出：

- 子代理分工与实际完成情况
- 创建或修改的文件
- 算法测试摘要
- 知识数据校验摘要
- 伦理测试摘要
- 尚未核验的传统异文
- 下一轮建议

不得声称未实际运行的测试已经通过。
