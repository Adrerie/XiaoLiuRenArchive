# 07 来源与校勘流程

## 1. 目标

本项目需要忠实记录传统小六壬知识，但不能把单一网络录文、现代门派说明或搜索摘要直接提升为经典原文。来源工程的目标不是收集最多文本，而是让每一条传统知识都能回答：来自哪个版本、由谁录入、与哪些版本不同、目前可信到什么程度。

## 2. 来源等级

### A 级：可识别版本的原始影印或正式出版物

可用于逐字校勘。必须记录书名、版本、出版或馆藏信息、页码、取得方式与文件哈希。版权受限材料只登记元数据和短引文，不上传整本扫描件。

### B 级：机构性辞典、目录与学术书目

可支持术语定义、篇目存在、版本线索与历史背景。不得用目录页替代正文校勘。

### C 级：现代网络录文

可作为候选文本、全文检索和异文发现工具。不得仅凭一个网页标记为 canonical。

### D 级：现代实践者解释、论坛、短视频与社交媒体

只用于记录当代流传变体和产品需求，不得自动进入传统基准知识。

## 3. 下载规则

Codex 可以下载公开允许访问的网页、PDF 或图像用于本地校勘，但必须满足：

1. 不绕过登录、付费墙、访问控制或反爬限制。
2. 不下载来源未授权公开的整本版权材料。
3. 下载后计算 SHA-256，并记录原始 URL、访问日期和本地目标路径。
4. 下载文件默认放在 `references/downloaded/`，该目录是否提交由版权与体积规则决定。
5. 任何自动 OCR 只能生成候选录文，不能覆盖人工校勘文本。
6. 网络页面变化后不得静默更新正式知识，必须产生校勘差异记录。

## 4. 校勘记录格式

每次校勘建立一个记录文件：

```text
references/collation/<work-id>/<date>-<reviewer>.json
```

最低字段：

```json
{
  "workId": "yuxiaji-liuren-shike",
  "baseSourceId": "source-id",
  "comparisonSourceIds": ["source-id-2"],
  "reviewer": "human-or-agent-id",
  "reviewedAt": "YYYY-MM-DD",
  "scope": "起课法与六宫断辞",
  "variants": [
    {
      "location": "小吉条",
      "baseReading": "属木",
      "variantReading": "属水",
      "sourceId": "source-id-2",
      "decision": "retain-as-disputed",
      "reason": "尚无足够版本证据确定唯一读法"
    }
  ],
  "approval": "pending-human-review"
}
```

## 5. 知识状态

- `unverified`：仅登记，未核对 URL 或内容。
- `provisional`：已有可用线索，但未完成版本校勘。
- `reviewed`：至少两类来源交叉核对，并完成人工复核。
- `canonical`：项目选定的当前基准读法，不代表历史上不存在异文。
- `disputed`：存在无法消除或不应消除的版本差异。

`canonical` 只表示“本项目当前采用的明确版本”，不得写成“唯一真实传统”。

## 6. 作者与历史归属

“李淳风六壬时课”等名称首先按文本题署记录。题署不能自动证明历史作者身份。UI 中如展示作者，应使用“题署李淳风”“传统归名李淳风”等准确措辞，直到有足够历史研究支撑。

## 7. 原典与现代释义

传统原文、编辑标点、现代译文和领域解释必须分字段保存：

```text
traditionalText.raw
traditionalText.punctuated
traditionalText.editorNotes
modernNeutralSummary
domainInterpretations
```

现代释义不得反向修改原文。原文含有时代性、性别化或超自然词语时，应保留原文，并通过历史说明和伦理规则限制其现代使用。

## 8. 合并门槛

任何将传统字段从 `provisional` 升级为 `reviewed` 或 `canonical` 的 PR 必须附：

- 来源清单
- 页码或定位方式
- 校勘记录
- 异文说明
- 版权处理说明
- 人工审阅结论

没有这些材料时，代码与 UI 可以使用 provisional 数据，但必须显式展示其状态。
