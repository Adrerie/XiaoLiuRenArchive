# UI Information Architecture

Version: `1.0.0-provisional`

## 1. Design Goal

界面应让用户清楚地区分：

- 我输入了什么
- 系统采用哪套历法策略
- 宫位如何算出
- 传统文本写了什么
- 现代解释如何组合
- 哪些结论被伦理规则限制
- 现实中应优先做什么

产品不采用“神谕式单屏答案”。结果页必须保留可展开的计算、知识和来源结构。

## 2. Navigation Model

第一版采用移动端优先的四个主入口：

```text
起课
资料库
说明
设置
```

桌面端可使用侧边栏，移动端使用底部导航。结果页属于“起课”流程，不额外占用主导航。

## 3. Page Map

```text
App
├─ 起课
│  ├─ 输入方式
│  ├─ 时间与历法策略
│  ├─ 问事领域与阶段
│  ├─ 现实事实与安全确认
│  ├─ 隐私与显示选项
│  └─ 结果
│     ├─ 现实优先提示
│     ├─ 最终宫位总览
│     ├─ 月日时推演
│     ├─ 现代解释
│     ├─ 传统原文
│     ├─ 异文与来源
│     └─ 结构化详情
├─ 资料库
│  ├─ 六宫列表
│  ├─ 六宫详情
│  ├─ 问事领域
│  ├─ 历法策略
│  └─ 来源档案
├─ 说明
│  ├─ 小六壬算法
│  ├─ 专家系统架构
│  ├─ 现代伦理原则
│  ├─ 科学与使用边界
│  └─ 版本与变更
└─ 设置
   ├─ 默认历法策略
   ├─ 简体或繁体
   ├─ 深色模式
   ├─ 减少动态效果
   ├─ 本地数据与隐私
   └─ 关于
```

## 4. Divination Flow

### Step 1: Input Mode

两个明确选项：

- 公历日期时间
- 手动农历

手动农历应是第一轮最可靠路径，不能隐藏在“高级设置”中。

### Step 2: Time and Calendar Policy

公历模式显示：

- 日期
- 时间
- IANA 时区
- 历法策略

手动农历显示：

- 农历月
- 农历日
- 十二时辰
- 是否闰月
- 当前手动输入策略说明

历法策略旁必须有简短说明和“查看差异”入口。不得用不透明的“传统模式”布尔开关。

### Step 3: Domain and Stage

先选问事领域，再显示该领域允许的阶段。

关系领域默认使用：

- 寻找伴侣
- 新认识
- 暧昧
- 交往中
- 长期承诺
- 已分开
- 复合

不询问攻受，不要求选择夫方或妻方。

### Step 4: Reality and Safety Facts

以简短、可跳过但明确的确认项收集事实：

- 对方是否已经明确拒绝
- 是否已有正式通知或合同
- 是否有检查结果或专业意见
- 是否存在现实安全风险

当用户选择高风险领域或关键词时，显示针对性确认。系统不得把自动分类结果直接当事实。

### Step 5: Privacy

默认：

- 不保存完整问题文本
- 导出不含完整问题
- 导出不含精确时间

用户可明确开启，但必须看到本地存储说明。

### Step 6: Review

提交前展示：

- 输入时间
- 历法策略
- 问事领域
- 阶段
- 现实事实
- 隐私选择

用户可返回修改。

## 5. Result Page Hierarchy

### 5.1 Hard Stop Banner

人员失联、现实危险等 `hard_stop` 场景，首屏先显示现实行动。传统结果折叠在后，不作为视觉中心。

### 5.2 Result Header

显示：

- 最终宫位名称
- 简短中性象意
- 当前领域
- 算法版本
- 历法策略
- provisional 或 disputed 标记

不使用“百分百准确”“大吉必成”等权威化语言。

### 5.3 Calculation Trace

采用三步卡片：

```text
月宫
输入农历月 → 计数路径 → 落宫

日宫
从月宫起初一 → 计数路径 → 落宫

时宫
从日宫起子时 → 计数路径 → 最终宫位
```

同时提供数学公式展开。移动端优先纵向，不强制复杂手掌动画。

### 5.4 Modern Interpretation

固定顺序：

1. 中性象意
2. 当前领域解释
3. 阶段修正
4. 可执行行动
5. 现实核验

每一块支持查看 fragment ID，但默认只在“结构化详情”中展示技术信息。

### 5.5 Ethics Notice

伦理提示应与对应内容邻近，不全部堆在页面底部。

例如：

- 关系拒绝提示放在关系解释上方
- 健康非诊断提示放在健康解释前
- 财务边界放在行动建议前

### 5.6 Traditional Text

原典区域必须标记：

- 来源
- 文本状态
- 是否网络录文
- 是否存在异文
- 历史用语说明

传统原文可完整展示，但现代解释不得伪装成原文。

### 5.7 Provenance Drawer

展示：

- algorithmId
- calendarPolicyId
- knowledgeVersion
- ruleVersion
- palaceId
- domainId
- stageId
- fragmentIds
- ethicsRuleIds
- sourceIds

支持复制结构化 JSON。

## 6. Knowledge Browser

### Palace List

六张主卡，不按简单“吉凶排行”排序，而按传统固定顺序展示。

每张卡显示：

- 宫名
- 中性关键词
- 五行与六神及争议标记
- 文本状态

### Palace Detail

标签页：

- 概览
- 原典
- 现代释义
- 问事领域
- 异文
- 来源

### Source Archive

来源卡显示：

- 类型
- 机构或出版者
- 支持哪些字段
- 不支持哪些结论
- 核验状态
- 外部链接

不得仅以来源数量制造权威感。

## 7. Settings

### Calendar

选择默认策略，并明确切换可能改变结果。

### Language

支持简体与繁体。简繁转换不得改变引用 ID 和历史文本底本记录。

### Appearance

- system
- light
- dark
- reduced motion

### Privacy

- 清除本地历史
- 是否保存问题文本
- 默认导出隐私
- 查看本地存储项

第一版默认不实现云同步。

## 8. Error States

### Invalid Date

说明具体字段问题，不自动改成邻近日期。

### Calendar Range Unsupported

显示历法库支持范围，并建议使用手动农历输入。

### Knowledge Validation Failure

正式构建中应阻止应用启动解释功能。开发模式显示具体缺失引用。

### Rule Conflict

不输出完整解释，显示“规则配置冲突”，保留计算结果与错误 ID供审计。

### Offline

核心功能继续可用。外部来源链接显示离线状态。

## 9. Accessibility

- 所有表单具有 label 和错误描述
- 宫位不能只靠颜色区分
- trace 可由屏幕阅读器按步骤朗读
- 折叠组件保留键盘操作
- 动画不超过必要程度
- 支持减少动态效果
- 中文正文行高适合长文本
- 原典与现代解释有明确标题而非仅靠视觉样式

## 10. Visual Direction

推荐“档案馆与历法工具”气质，而不是夸张玄学游戏界面。

可使用：

- 清晰留白
- 低饱和传统色
- 宫位符号与计数路径
- 纸本文献式来源卡
- 现代无衬线正文与适度宋体标题

避免：

- 旋转罗盘式无意义动画
- 红黑恐吓色
- 结果开箱赌博机效果
- “再算一次直到满意”按钮
- 付费解锁吉祥答案

## 11. First Implementation Components

建议最低组件集合：

```text
AppShell
PrimaryNavigation
InputModeSelector
CivilDateTimeForm
ManualLunarForm
CalendarPolicyPicker
QuestionDomainPicker
StagePicker
RealityFactsForm
PrivacyOptions
RequestReview
ResultHeader
HardStopBanner
CalculationTrace
InterpretationSections
TraditionalTextPanel
VariantBadge
SourceList
ProvenanceDrawer
PalaceLibrary
SettingsPage
ErrorBoundary
```

## 12. Responsive Priority

首要断点是 360 至 430 像素移动屏。桌面端增加双栏，但不得让移动端缺失来源、伦理或 trace 内容。
