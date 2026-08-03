# Codex 子代理编排规范

## 1. 总则

本项目必须由总控代理协调多个专职子代理完成。禁止单个代理在同一工作区中同时设计历法、修改核心算法、撰写知识库、构建界面并自行宣称审计通过。

总控代理负责：

- 读取全部规范
- 创建任务图
- 分配相互独立的工作区或 worktree
- 管理接口合同
- 收集子代理报告
- 组织合并
- 处理冲突
- 要求独立审计

总控代理不得绕过人工决定未解决的传统异文。

## 2. 强制子代理

### 2.1 architecture-agent

负责：

- 项目脚手架
- 模块边界
- TypeScript strict 配置
- 本地数据加载方式
- 依赖方向与循环依赖检查

不得：

- 修改起课公式
- 填写传统断辞
- 自行选择异文

交付：

- 架构决策记录
- 目录结构
- 公共接口草案
- 依赖图

### 2.2 calendar-agent

负责：

- 公历到农历适配器
- IANA 时区
- 十二时辰映射
- 闰月标识
- 子时策略
- 历法错误结构
- 历法回归测试

必须阅读：

- `docs/03-calendar-policy.md`
- `algorithm/contract.md`

不得：

- 在历法适配器中计算六宫解释
- 静默决定争议策略
- 在结果中遗漏 `calendarPolicyId`

### 2.3 core-algorithm-agent

负责：

- 六宫常量
- `positiveMod`
- 月宫、日宫、时宫纯函数
- trace 生成
- 输入校验
- 核心单元测试和属性测试

必须阅读：

- `algorithm/contract.md`
- `algorithm/test-vectors.v1.json`

不得：

- 接收身份字段
- 读取系统时间
- 调用网络
- 读取问题内容
- 加入随机数
- 根据 UI 需求改变返回语义

### 2.4 knowledge-agent

负责：

- JSON Schema
- 六宫数据
- 来源注册表
- 问事领域知识
- 异文记录
- 数据校验脚本

必须阅读：

- `knowledge/source-registry.json`
- `knowledge/palaces.schema.json`
- `knowledge/palaces.v1.json`
- `knowledge/question-domains.v1.json`

不得：

- 将单一网络录文升级为校定本
- 删除来源与争议状态
- 把现代解释冒充原典
- 复制受限制的整本资料

### 2.5 ethics-agent

负责：

- 本地伦理规则引擎
- 触发条件
- 禁止结论类型
- 必需提示
- 关系多样性支持
- 健康、法律、金融、生死和失踪边界
- 伦理测试

必须阅读：

- `docs/06-modern-ethics.md`
- `knowledge/ethics-rules.v1.json`
- `knowledge/question-domains.v1.json`

不得：

- 修改宫位
- 隐藏原典
- 推断第三方身份
- 用吉宫覆盖拒绝
- 把同性关系转换为夫妻角色

### 2.6 frontend-agent

负责：

- 输入流程
- 排盘 trace 可视化
- 六宫结果页
- 原典与现代解释分栏
- 来源和版本展示
- 无障碍与响应式界面

不得：

- 在组件内重写核心算法
- 用界面文案覆盖结构化知识
- 隐藏争议、警告与历法策略
- 默认上传用户问题

### 2.7 test-audit-agent

负责独立复核，不参与主要实现。

必须：

- 从合同重新推导测试预期
- 验证固定测试向量
- 穷举 12 × 30 × 12 数学输入
- 测试 identity invariance
- 测试伦理 hard-block
- 测试 JSON Schema
- 测试历法边界
- 检查是否存在网络调用
- 检查算法是否散落在 UI

不得：

- 为通过测试而修改预期值
- 在未运行命令时声称通过

## 3. 可选子代理

### export-agent

负责本地 PNG、PDF 或文本导出。默认应对精确时间、问题原文和身份信息提供隐私选择。

### accessibility-agent

负责键盘操作、屏幕阅读器、对比度、动态效果减弱和中文排版。

### data-validation-agent

独立检查 JSON Schema、重复 ID、缺失来源、无效规则引用和死链接登记。

### release-agent

负责版本号、变更日志、构建产物和 Android 封装。不得在发布阶段修改算法。

## 4. 建议任务图

```text
architecture-agent
   ├── calendar-agent ─────────┐
   ├── core-algorithm-agent ───┤
   ├── knowledge-agent ────────┼── integration by controller
   ├── ethics-agent ───────────┤
   └── frontend-agent ─────────┘
                                  ↓
                         test-audit-agent
                                  ↓
                          human review / PR
```

可以并行的工作：

- calendar-agent 与 core-algorithm-agent
- knowledge-agent 与 ethics-agent
- frontend-agent 的静态布局与底层逻辑

必须等待的依赖：

- frontend-agent 接入结果前，核心接口必须冻结
- ethics-agent 接入前，规则数据必须通过 Schema
- test-audit-agent 必须在整合完成后运行

## 5. 分支与 worktree

推荐：

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

每个子代理应使用独立 branch 或 worktree。禁止多个代理同时修改同一文件而不声明所有权。

建议文件所有权：

| 区域 | 主代理 |
|---|---|
| `src/core/**` | core-algorithm-agent |
| `src/calendar/**` | calendar-agent |
| `knowledge/**` | knowledge-agent |
| `src/ethics/**` | ethics-agent |
| `src/components/**` | frontend-agent |
| `tests/audit/**` | test-audit-agent |

共享类型由 architecture-agent 首先建立，后续改动须通知所有依赖代理。

## 6. 第一轮最小闭环

### 阶段 A：脚手架

- React + TypeScript + Vite
- Vitest
- JSON Schema 校验
- 无远程 AI 依赖
- 基础 CI

### 阶段 B：核心

- 历法适配器
- 传统推理机
- trace
- 固定测试向量

### 阶段 C：知识

- 六宫数据加载
- 通用解释组合
- 问事领域选择
- 来源展示

### 阶段 D：伦理

- 规则求值
- 禁止结论过滤
- 必需提示
- 同性关系与第三方身份测试

### 阶段 E：界面

- 日期与手动农历输入
- 三阶段排盘展示
- 原典、现代释义、领域解释和边界提示
- 本地结果保存或导出

### 阶段 F：审计

- 全部测试
- 构建
- 网络依赖扫描
- 数据引用完整性
- UI 截图

## 7. 子代理报告格式

每个子代理结束时必须提交：

```markdown
## Scope

## Files changed

## Decisions

## Contracts consumed

## Tests actually run

## Results

## Known limitations

## Conflicts or unresolved questions
```

“测试通过”必须附实际命令。无法运行时写明原因。

## 8. 合并门槛

合并到整合分支前必须满足：

- 核心算法向量全部通过
- JSON 可解析并通过 Schema
- 所有引用 ID 存在
- 没有远程生成式 AI 调用
- 身份字段未进入核心算法
- 健康领域不能输出诊断和风险排除
- 感情领域不能推断第三方性取向
- 明确拒绝不能被任何吉宫覆盖
- 空亡不能生成死亡或绝症断言

## 9. 冲突升级

以下问题必须交给人工决定：

- 原典版本冲突
- 小吉五行等异文选择
- 子时换日默认策略变更
- 新增流派算法
- 删除传统原文
- 伦理规则与传统解释的边界争议

总控代理应提供候选方案、来源、影响范围和测试差异，不得代替人工作最终裁决。
