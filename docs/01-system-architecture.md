# 专家系统架构

## 1. 系统性质

XiaoLiuRenArchive 是一个面向传统小六壬知识整理、确定性起课与现代语境解释的本地专家系统。

这里的“专家系统”是软件架构定义，不构成对术数预测效力的科学背书。系统需要准确复现被选定版本的小六壬规则，并向用户清楚说明推理路径、知识来源与解释边界。

## 2. 双推理引擎

### 2.1 Traditional Inference Engine（传统推理机）

职责：

- 接收规范化后的农历月、农历日与十二时辰序号
- 按冻结规则计算月宫、日宫与时宫
- 生成逐步 trace
- 返回算法版本与历法策略 ID

约束：

- 纯函数
- 无网络
- 无随机数
- 无用户身份字段
- 无解释文案
- 无伦理改写

### 2.2 Interpretation Rule Engine（解释规则引擎）

职责：

- 根据最终宫位和三宫 trace 读取本地知识
- 根据问事领域选择结构化解释片段
- 应用风险与伦理规则
- 返回传统文本、现代释义、领域解释、边界提示与来源

约束：

- 不得修改宫位
- 不得补造传统原文
- 不得自由生成断语
- 不得根据性别、性取向或身份改变算法
- 不得把伦理过滤包装成传统规则

## 3. 工作记忆

单次会话事实建议使用以下结构：

```ts
interface ConsultationFacts {
  normalizedTime: {
    lunarMonth: number;
    lunarDay: number;
    earthlyBranchIndex: number;
    isLeapMonth: boolean;
    timeZone: string;
    calendarPolicyId: string;
  };
  question: {
    domainId: string;
    stageId?: string;
    asksAboutSpecificPerson?: boolean;
    asksAboutThirdPartyIdentity?: boolean;
    explicitRefusalExists?: boolean;
    highRiskFlags?: string[];
  };
  language?: 'zh-CN' | 'zh-TW';
}
```

身份字段若仅用于称谓，不得传入传统推理机。

## 4. 推理顺序

```text
用户输入
  ↓
历法规范化
  ↓
传统推理机
  ↓
宫位与 trace
  ↓
知识检索
  ↓
领域规则匹配
  ↓
伦理规则求值
  ↓
结构化解释结果
  ↓
界面渲染或本地导出
```

伦理规则仅作用于解释输出，不反向作用于历法或宫位。

## 5. 规则优先级

从高到低：

1. 安全与现实边界规则
2. 冻结算法合同
3. 已批准的传统版本规则
4. 问事领域规则
5. 现代释义模板
6. 界面表达偏好

安全规则可以阻止危险断言，但不能伪造另一个落宫。传统文本若含不适宜内容，应原文保留并配套现代说明，而不是静默改写。

## 6. 可解释性要求

每次结果至少返回：

- `algorithmVersion`
- `calendarPolicyId`
- `monthPalaceId`
- `dayPalaceId`
- `hourPalaceId`
- `traceSteps`
- `sourceIds`
- `interpretationFragmentIds`
- `ethicsRuleIds`
- `knowledgeVersion`

系统必须能回答：

- 为什么得到这个宫位
- 采用了哪套历法边界
- 传统文本来自哪里
- 现代解释用了哪些规则
- 哪些内容因伦理边界未作判断

## 7. 冲突处理

若出现以下冲突，不得静默选择：

- 不同版本对五行、六神、方位或数字的记载不同
- 子时换日规则不同
- 闰月是否按原月数起课不同
- 网络资料与影印本不一致

应返回或记录：

```ts
interface KnowledgeConflict {
  field: string;
  candidates: Array<{
    value: unknown;
    sourceId: string;
  }>;
  resolutionStatus: 'unresolved' | 'provisional' | 'approved';
  approvedValue?: unknown;
  rationale?: string;
}
```

## 8. 非目标

本系统不是：

- 生成式聊天机器人
- 科学预测模型
- 心理治疗系统
- 医疗诊断系统
- 法律或投资决策系统
- 用于判断第三方隐私身份的工具
