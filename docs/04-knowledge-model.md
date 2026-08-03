# 本地知识组合模型

## 1. 目标

本项目不使用生成式 API 生成断语。所有结果文本由本地结构化知识、确定性模板和伦理规则组合产生。

系统输出不是一段不可追踪的自由文本，而是多个可定位片段的有序组合。

## 2. 知识层级

### 2.1 原典层

保存传统文本、题署、版本、录文状态和异文。

不得：

- 把现代改写写入原典字段
- 无来源补句
- 静默修正不确定字词

### 2.2 宫位语义层

提取不依赖具体问事领域的结构，例如：

- 速度
- 动静
- 稳定性
- 信息清晰度
- 合作或冲突倾向
- 常见风险

这些是现代知识工程标签，不冒充原典词汇。

### 2.3 问事领域层

把宫位语义映射到感情、学业、工作、财务、出行、寻物、健康和法律等领域。

领域解释必须：

- 保留宫位核心含义
- 使用条件性语言
- 给出现实核验动作
- 不产生领域专业结论

### 2.4 阶段修饰层

同一领域可根据阶段调整重点。例如感情领域的：

- 寻找对象
- 初识
- 暧昧
- 交往
- 长期承诺
- 分开
- 复合

阶段只改变解释重点，不改变宫位。

### 2.5 伦理规则层

识别禁止结论与强制提示，例如：

- 不推断第三方性取向
- 不覆盖明确拒绝
- 不诊断疾病
- 不预测死亡
- 不保证投资回报
- 不预测裁判结果
- 失踪与危险应转向现实求助

## 3. 推荐输出对象

```ts
interface InterpretationResult {
  resultId: string;
  algorithmVersion: string;
  calendarPolicyId: string;
  knowledgeVersion: string;

  palaces: {
    monthPalaceId: PalaceId;
    dayPalaceId: PalaceId;
    hourPalaceId: PalaceId;
  };

  sections: {
    calculationTrace: TraceSection;
    traditional: TextFragment[];
    modernGeneral: TextFragment[];
    domainSpecific: TextFragment[];
    realityChecks: TextFragment[];
    ethicsNotices: TextFragment[];
    sources: SourceReference[];
  };

  provenance: {
    sourceIds: string[];
    interpretationFragmentIds: string[];
    ethicsRuleIds: string[];
  };
}
```

## 4. 组合顺序

第一版固定顺序：

```text
1. 计算结果与 trace
2. 最终宫位的传统资料
3. 最终宫位的中性现代释义
4. 问事领域解释
5. 阶段修饰
6. 现实核验建议
7. 伦理提示
8. 来源与版本
```

不得把伦理提示藏在折叠区域中，也不得用传统文本覆盖现代边界。

## 5. 文本片段

建议每段文本具有独立 ID：

```ts
interface TextFragment {
  id: string;
  text: string;
  layer: 'traditional' | 'modern_general' | 'domain' | 'stage' | 'reality_check' | 'ethics';
  palaceId?: PalaceId;
  domainId?: string;
  tags: string[];
  sourceIds: string[];
  status: 'provisional' | 'approved' | 'deprecated';
}
```

第一版 JSON 仍可使用嵌套文本。工程实现时应在加载阶段生成稳定片段 ID，例如：

```text
palace.da_an.modern.summary
palace.liu_lian.domain.relationship.caution
ethics.no-third-party-orientation-inference.notice
```

## 6. 规则匹配

解释引擎不使用模糊自然语言推理。问题必须先由用户选择领域，或由完全本地、可撤销的关键词辅助分类。自动分类结果必须允许用户确认。

建议事实：

```ts
interface InterpretationFacts {
  palaceId: PalaceId;
  domainId: string;
  stageId?: string;
  asksAboutSpecificPerson: boolean;
  asksAboutThirdPartyIdentity: boolean;
  explicitRefusalExists: boolean;
  highRiskFlags: string[];
}
```

规则引擎根据显式字段求值，不从用户文本猜测敏感身份。

## 7. 冲突与去重

当多个规则同时触发：

- 按伦理规则优先级排序
- 相同 `requiredNotice` 只显示一次
- `hard-stop` 高于 `hard-block`
- `hard-block` 高于语言约束
- 现实求助动作置于解释之前
- 禁止结论从候选片段集合中移除

不得先生成危险文本再仅以一句免责声明抵消。

## 8. 本地检索

第一版无需向量数据库。推荐：

- 按 `palaceId` 精确读取
- 按 `domainId` 精确读取
- 按 `stageId` 可选读取
- 按伦理条件布尔求值
- 通过索引 Map 缓存

知识量增加后仍优先使用可审计的标签与规则。不得为了“更自然”而接入远程模型。

## 9. 多语言

繁简转换不得直接覆盖原始录文。建议：

- 原典保存原录文字符形态
- 现代解释分别维护 `zh-CN` 与 `zh-TW`，或使用经过审查的本地转换
- 专名、异体字和引用不自动改写

## 10. 版本与迁移

每个知识文件包含：

- `schemaVersion`
- `knowledgeVersion`
- `status`

修改传统字段、规则语义或片段 ID 时必须：

- 更新知识版本
- 提供迁移说明
- 保留旧版本测试快照
- 说明是否改变既有输出

纯文字错别字修订也应记录，因为它可能影响导出与校勘。
