# XiaoLiuRenArchive · 小六壬档案

一个面向传统小六壬知识整理、规则推演与现代语境解释的本地专家系统。

本项目以传统报时起课法为计算核心，以结构化知识库保存六宫资料、版本异文、问事解释、受控安全文案与伦理规则。核心推演在本地完成，不接入生成式 AI、远程断语服务或云端推理 API。

> 术数计算遵循传统，文本解释区分古今，产品设计服从现代伦理。

## 当前状态

R2 Calendar and Knowledge Expansion 已完成并合并到 `main`。

R3 Mobile Packaging 已审阅并合并到 `main`：Capacitor Android 容器、离线资源同步、运行时网络审计、系统返回键适配、Android debug build 和短期 APK artifact 已形成闭环。

R4 Device Validation and Beta Hardening 已完成并合并到 `main`：真实 USB Android 平板设备验证、离线资源、导出、权限与 beta 版本一致性已经收口。

R5 Entry Localization and Number Method 当前在 `feature/r5-entry-localization-number-method` 完成：Web 默认当前时间入口、四种起课方式无缝切换、阶段中文化和独立三数起课正在统一验证，随后执行实体设备 launcher 冷启动自查。

当前已经具备：

- React、TypeScript strict 与 Vite 本地 Web 工程
- 手动农历与公历时间输入
- Web 默认读取设备当前本地时间，并支持显式刷新当前时间
- 当前时间、公历指定时间、手动农历和三数起课四种方式在同一卡片内切换并保留独立草稿
- 关系阶段中文标签和独立的三数现代变通法（不伪装为农历月日时）
- 两种公历日期边界策略、IANA 时区和 fold 处理
- 固定月、日、时起课算法和完整 trace
- 本地六宫、领域、阶段、来源和异文知识
- 解释组合与伦理过滤
- 普通、hard-block 与 hard-stop 结构化结果
- 知识包 manifest、迁移记录和失败闭合版本校验
- 完整 provenance、disputed 字段与展示片段聚合
- 六宫资料库、本地搜索、详情、异文和来源卡
- 结构化结果详情和隐私优先 JSON 复制/下载
- 移动端与桌面端关键交互验证
- `0.5.0-beta.1` 测试版版本、beta-debug 渠道与本地优先边界

当前执行计划：

```text
codex/r5-entry-localization-number-method-plan.md
```

## 执行优先

所有后续计划遵循 `codex/execution-first-policy.md`。

默认优先级：

```text
实际实现 > 核心功能测试 > 必要修正 > 文档记录
```

开始时只由主代理快速阅读入口文件。子代理只读取自己的任务书和直接依赖，不进行全仓扫描。已经确认的架构和需求直接继承。验证只保留构建、核心测试、关键交互实测和少量截图。失败时只追查对应模块。

## 系统结构

```text
用户请求
  ↓
Calendar Adapter
  ↓
Traditional Inference Engine
  ↓
Interpretation Rule Engine
  ↓
Ethics Rule Engine
  ↓
DivinationResult
  ↓
本地 Web / Android UI
```

### 冻结算法

六宫顺序：

```text
大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡
```

计算：

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

核心函数只接收农历月、农历日和十二时辰序号。问题文本、领域、性别、性取向和其他身份字段不得进入计算。

## 现代伦理底线

- 同性、双性、无性、跨性别与非二元关系按正常亲密关系处理
- 不强制映射夫位、妻位、攻受或性别化阴阳角色
- 不推断第三方性取向、性别身份或出柜状态
- 明确拒绝和现实危险优先于占断
- 不输出医疗诊断、收益保证、法律保证、死亡预测或无证据犯罪指控
- 伦理引擎可以阻止结论，但不能修改落宫

## R2 Calendar and Knowledge Expansion

R2 已完成：

1. 知识包版本与迁移记录
2. 全部展示区块的 provenance 聚合
3. 公历策略选择和本地 IANA 时区搜索
4. 六宫资料库、搜索、详情、异文和来源
5. 结构化结果详情
6. 隐私优先的本地 JSON 复制与下载
7. 23:00 子初换日真实偏移追踪
8. 现代解释与传统资料的来源分离
9. manifest 与知识文件版本的一致性校验

## R3 Mobile Packaging

R3 已审阅并合并到 `main`，GitHub Android debug build 与短期 APK artifact 已形成闭环。本节保留 R3 交付边界，R4 只在其上增加设备验证和测试版加固。

当前实现包含：

- Capacitor 8 Android 容器，固定 appId/appName，构建产物使用本地相对资源路径
- `npm run mobile:sync`、`npm run mobile:open` 和 `npm run mobile:build:debug`
- Android 安全区、系统返回键分层返回和离线本地资源运行
- `npm run audit:network` 运行时网络审计与 PR/main GitHub CI

R3 计划完成：

1. 修正 `provisionalSourceIds` 状态分类
2. Capacitor Android 工程与本地资源同步
3. Android 安全区、系统返回键和离线闭环
4. 运行时网络审计
5. GitHub CI 独立验证
6. debug APK 构建或明确工具链阻塞报告

R3 不做账号、云同步、社区、PDF、PNG、正式商店发布、签名 release 包或生成式 AI 解释。

## R4 Device Validation and Beta Hardening

R4 实现已完成并合并：统一 `xiaoliurenarchive` / `0.4.0-beta.1` / Android versionCode `401` / `beta-debug`，包含 Android 原生隐私 JSON 导出、系统浏览器来源链接、无 INTERNET 权限与无备份配置、项目品牌资源、稳定设备选择器和离线实体设备 smoke。设备验证使用 USB 连接的真实 Android 平板，不创建模拟器、不切换网络或锁屏状态。R5 当前发布版本为 `0.5.0-beta.1` / Android versionCode `501`。

## Codex 开发入口

主代理只需先阅读：

1. `README.md`
2. `AGENTS.md`
3. `CODEX_MASTER_PROMPT.md`
4. `codex/execution-first-policy.md`
5. `codex/r5-entry-localization-number-method-plan.md`

随后按计划执行。只有主代理操作 Git，并持续负责 Capacitor、Android、CI、构建、应用接线和 PR 收尾。

## R3 必要验收

- `npm run validate:knowledge` 成功
- `npm run audit:network` 成功
- `npm run typecheck` 成功
- `npm run build` 成功
- `npm test`、`npm run test:core`、`npm run test:ethics` 成功
- Capacitor Android 工程可完成资源同步
- 本机工具链可用时 debug APK 构建成功
- 手动农历、公历、hard-block、hard-stop 和资料库无回归
- Android 核心流程离线可用
- CI 提供独立可见的验证状态

## 仓库入口

- `src/`：Web 工程、历法、算法、知识、伦理、服务与界面
- `android/`：R3 Android 容器、R4 beta 资源与 Gradle wrapper
- `algorithm/`：传统计算、解释与伦理合同
- `knowledge/`：结构化知识、规则和 Schema
- `fixtures/`：黄金与伦理案例
- `docs/`：产品、UI、来源、构建和历史决策
- `codex/`：执行计划与子代理任务书
- `scripts/`：知识校验与发布审计脚本

本项目当前处于 **R4 已完成并合并，R5 Entry Localization and Number Method 正在实施** 阶段。
