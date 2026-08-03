# Batch 03 Implementation Gate

在创建 React、TypeScript、Vite 或其他工程代码之前，总控代理必须完成本门槛。

## 1. 必读新增文件

除 `CODEX_MASTER_PROMPT.md` 原有清单外，必须阅读：

1. `docs/07-source-collation.md`
2. `docs/08-testing-standard.md`
3. `docs/09-output-contract.md`
4. `knowledge/question-domains.schema.json`
5. `knowledge/ethics-rules.schema.json`
6. `knowledge/source-registry.schema.json`
7. `knowledge/calendar-policies.schema.json`
8. `knowledge/calendar-policies.v1.json`
9. `knowledge/interpretation-fragments.schema.json`
10. `knowledge/interpretation-fragments.v1.json`
11. `knowledge/divination-result.schema.json`
12. `scripts/README.md`
13. `scripts/validation-manifest.json`

## 2. 子代理前置产物

### architecture-agent

提交目录结构、模块依赖图和禁止依赖列表。必须保证：

```text
calendar -> core algorithm
core algorithm -X-> interpretation
interpretation -> knowledge loader
ethics -> interpretation output
frontend -> application service
frontend -X-> raw algorithm constants
```

### data-validation-agent

先实现知识 Schema 和引用校验，再允许知识加载器进入应用。校验器必须可以在没有浏览器的 Node 环境运行。

### calendar-agent

实现 `calendarPolicyId` 驱动的适配器。不得把 23:00 换日或闰月策略写成无法追踪的布尔常量。

### core-algorithm-agent

只接收规范化农历月、日和时辰序号。禁止接收 Date、时区、性别、问题文本或领域 ID。

### knowledge-agent

实现不可变知识包加载与索引。不得在加载时修补缺失字段。

### ethics-agent

实现规则求值结果对象，不直接返回随意拼接的整段文案。

### test-audit-agent

在任何 UI 开始前独立验证传统示例、枚举属性、Schema 与引用完整性。

## 3. 最小工程闭环

第一轮实现只需支持：

1. 手动农历输入
2. 一个默认历法策略对象
3. 冻结核心起课
4. 六宫中性象意
5. 一个问事领域选择
6. 解释片段组装
7. 伦理规则求值
8. 结构化结果 JSON
9. 简单页面展示 trace
10. 全部本地测试

公历转农历可以与手动输入并行开发，但不得阻塞核心算法和知识校验闭环。

## 4. 禁止抢跑

在知识校验、引用检查和核心算法测试通过前，不得优先开发：

- 动画与复杂视觉
- Android 打包
- PDF 或长图导出
- 历史记录与云同步
- 用户账号
- 分享社区
- 付费功能
- AI 解读
- 现代流派扩展

## 5. 完成报告

总控代理必须提交：

- 实际创建的子代理与职责
- 每个子代理的分支或 worktree
- 知识校验报告
- 核心算法测试报告
- 伦理红队测试报告
- 输出合同示例 JSON
- 尚未实现或尚未核验的项目

没有实际运行的命令不得写成“已通过”。
