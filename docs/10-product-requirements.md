# Product Requirements Document

Version: `1.0.0-provisional`

## 1. Product Goal

XiaoLiuRenArchive 第一阶段产品是一款本地优先、可离线、可审计的小六壬知识与排盘应用。它将传统报时起课法、结构化六宫资料、现代问事解释和伦理边界组合为透明的专家系统。

产品不以“预测准确率”或制造神秘权威为卖点。核心价值是：

- 忠实执行选定传统算法
- 公开显示计算过程
- 区分原典、异文与现代解释
- 在多元关系和高风险问题上提供现代伦理边界
- 允许用户离线使用，不上传问题文本

## 2. Target Users

### 2.1 传统文化学习者

需要查看起课过程、六宫属性、原文和版本差异。

### 2.2 一般排盘用户

希望快速输入时间并获得易读、非恐吓式的解释。

### 2.3 研究与开发人员

需要结构化 JSON、来源追踪、算法版本和可重复测试。

## 3. Product Principles

1. 本地计算优先。
2. 相同输入产生相同结果。
3. 计算与解释分离。
4. 原典与现代释义分栏。
5. 现实证据优先于占断。
6. 不以身份改变算法。
7. 不推断第三方敏感身份。
8. 不使用付费化解、恐吓和连续重算诱导。
9. 所有正式解释来自登记知识片段。
10. 争议规则必须可见并可追踪。

## 4. First Release Scope

### 4.1 Input

必须支持：

- 手动农历月、日、时辰输入
- 公历本地日期时间输入
- IANA 时区选择
- 历法策略选择
- 问事领域选择
- 可选关系或事件阶段
- 用户明确事实确认
- 高风险 flag 的本地确认
- 是否保存问题文本的隐私选择

不得要求：

- 账号
- 手机号
- 真实姓名
- 性别或性取向
- 云端同步

### 4.2 Calculation

必须支持：

- 大安、留连、速喜、赤口、小吉、空亡固定顺序
- 月宫、日宫、时宫
- 完整 trace
- `algorithmId`
- `calendarPolicyId`
- 输入校验和结构化错误

### 4.3 Interpretation

必须显示：

- 最终宫位
- 六宫中性象意
- 当前问事领域解释
- 阶段修正
- 现实行动提示
- 原典或传统属性
- 异文和证据状态
- 伦理提示
- 来源与知识版本

### 4.4 Safety

必须处理：

- 明确拒绝与同意
- 第三方性取向与性别身份
- 同性关系与多元性别关系
- 医疗诊断和风险排除
- 财务买卖与收益保证
- 法律结果保证
- 死亡与寿命预测
- 人员失联和现实危险
- 犯罪指控
- 鬼神与诅咒现实归因
- 未成年人安全

### 4.5 Knowledge Browser

必须支持：

- 六宫列表
- 单宫详情
- 原典与现代释义切换
- 来源状态
- 异文显示
- 搜索宫名和关键词

## 5. Out of Scope for First Release

- 大六壬体系
- 随机报数、姓名笔画和自创扩展算法
- 生成式 AI 断语
- 云端推理
- 社区和公开分享流
- 付费问事或付费化解
- 用户画像与推荐系统
- 自动判断第三方身份
- 自动诊断、投资建议和法律意见
- 复杂命盘社交比较
- Android 正式商店发布

Android 容器可以在后续版本加入，但不阻塞第一轮 Web 闭环。

## 6. Functional Requirements

### FR-001 Knowledge validation

应用构建前必须完成 JSON Schema 和跨文件引用校验。无效知识包不得进入正式构建。

### FR-002 Request validation

所有输入必须通过 `divination-request.schema.json`。错误以字段级信息反馈，不得静默纠正关键历法字段。

### FR-003 Manual lunar flow

用户可选择农历月、日、时辰和闰月标记，应用生成月宫、日宫和时宫。

### FR-004 Civil datetime flow

用户可选择本地公历时间与时区，应用依据明确 `calendarPolicyId` 转换。

### FR-005 Calculation trace

结果页必须能显示每一步如何从数字落到宫位。

### FR-006 Domain interpretation

用户选择领域后，系统从结构化领域知识和片段库组装解释。

### FR-007 Ethics evaluation

解释输出前必须执行伦理规则引擎。任何 hard-block 或 hard-stop 必须反映在结构化结果和 UI 中。

### FR-008 Provenance

每次结果必须记录算法、历法策略、知识版本、规则 ID、片段 ID 和来源 ID。

### FR-009 Privacy

问题文本默认不持久化。导出时默认不包含完整问题文本、精确时间和身份信息。

### FR-010 Offline operation

完成首次安装后，核心排盘、知识浏览和解释必须在无网络状态运行。

### FR-011 Export readiness

第一轮可以只提供结构化 JSON 导出接口。PNG、PDF 和长图属于后续功能。

### FR-012 Accessibility

关键流程必须支持键盘、屏幕阅读器、合理对比度和减少动态效果。

## 7. Non-Functional Requirements

### Determinism

相同请求、知识版本和规则版本必须输出相同结构化结果。

### Performance

本地知识加载后，单次排盘和解释在普通移动设备上应近乎即时。第一阶段目标为 100ms 级逻辑执行，不将动画计入。

### Reliability

核心算法和伦理 hard-block 不允许依赖网络。

### Maintainability

知识数据、规则、算法和 UI 必须分层，禁止组件内复制算法常量。

### Testability

所有核心接口可在 Node 环境测试，不依赖浏览器 DOM。

### Security

不得包含 API Key、远程断语端点、跟踪脚本或默认问题上传。

## 8. User Stories

### US-001

作为一般用户，我输入农历日期和时辰后，可以看到最终宫位和逐步计算，不必相信黑箱结果。

### US-002

作为男同性恋用户，我可以正常询问亲密关系，不会被强制映射为夫位与妻位。

### US-003

作为研究者，我可以查看传统文本的来源和异文状态。

### US-004

作为健康问题用户，我仍可查看传统象意，但系统不会用宫位诊断或排除疾病。

### US-005

作为隐私敏感用户，我可以不保存问题文本，并在导出前移除精确时间。

### US-006

作为开发者，我可以通过结构化 trace 重现每个解释片段和命中规则。

## 9. Success Criteria for First Implementation

第一轮成功不以下载量或占断“准确率”衡量，而以以下条件衡量：

- 核心算法向量全部通过
- 请求和结果 Schema 通过
- 所有知识引用完整
- 黄金样例通过
- 伦理红队样例通过
- 构建成功
- 离线核心功能可用
- 无远程生成式 AI 调用
- UI 明确展示历法策略和来源状态
- 身份字段变化不改变落宫

## 10. Product Risks

### Knowledge authority risk

网络录文可能存在异字和混流派问题。通过 provisional 状态和来源校勘流程降低风险。

### Ethical overreach risk

传统断辞可能被误解为诊断或确定预测。通过双层展示、claim filtering 和现实提示降低风险。

### Scope creep

项目容易扩展为庞杂术数平台。第一轮严格限制为传统报时起课与八类问事领域。

### False confidence from polished UI

精美界面可能增加不当权威感。必须持续展示版本、证据状态和非科学验证边界。

## 11. Release Stages

### R0 Foundation

知识、算法、Schema、伦理和测试合同。已完成 Batch 02 至 Batch 04 规范阶段。

### R1 Local Web MVP

完成最小闭环、测试和基础页面。

### R2 Calendar and Knowledge Expansion

增强公历转换、版本校勘、知识浏览和导出。

### R3 Mobile Packaging

Capacitor Android、离线资源和发布审计。
