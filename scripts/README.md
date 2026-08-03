# Knowledge Validation Scripts

本目录由 Codex 的 `data-validation-agent` 实现。第一轮不允许把校验逻辑散落在前端加载代码中，必须提供可在 CI 和本地独立运行的命令。

## 必需命令

建议形成以下 npm scripts：

```json
{
  "scripts": {
    "validate:schemas": "node scripts/validate-schemas.mjs",
    "validate:references": "node scripts/check-references.mjs",
    "validate:text": "node scripts/check-modern-text.mjs",
    "validate:knowledge": "npm run validate:schemas && npm run validate:references && npm run validate:text"
  }
}
```

## validate-schemas.mjs

职责：

- 使用支持 JSON Schema Draft 2020-12 的本地校验器。
- 按 `validation-manifest.json` 将每个数据文件与 Schema 对应。
- 开启严格模式和 format 校验。
- 输出文件路径、JSON Pointer、关键字和错误信息。
- 任一错误以非零退出码结束。
- 不得自动删除未知字段或强制转换类型后继续通过。

## check-references.mjs

职责：

建立以下命名空间：

- palace IDs
- domain IDs
- stage IDs
- ethics rule IDs
- source IDs
- fragment IDs
- calendar policy IDs

检查：

- 所有引用存在。
- 每个命名空间 ID 唯一。
- `defaultPolicyId` 存在。
- `mandatoryEthicsRuleIds`、`requiresEthicsRuleIds` 均存在。
- fragment 的 palace、domain 和 stage 限定可解析。
- palace 中的 sourceIds 存在。
- 结果 Schema 中冻结宫序与算法合同一致。

引用错误不得只警告，必须失败。

## check-modern-text.mjs

该脚本是启发式审计，不取代伦理规则引擎和人工审阅。

扫描现代释义、领域解释、行动提示与片段文本，标记：

- `一定`、`必然`、`百分之百`、`命中注定`、`永远不会` 等确定性措辞
- `同性无姻缘`、`阴阳不全`、`夫位`、`妻位`、`攻为阳`、`受为阴`
- `一定没病`、`必有重病`、`必死`、具体寿命与死亡日期模板
- 买入、卖出、转账、加杠杆等以占断为依据的指令
- 无证据的盗窃、诈骗、出轨、犯罪指控
- 将鬼神、诅咒或禳解写成现实因果结论

传统原文允许保留历史词语，但必须位于明确的传统文本字段，不能误报为现代解释。实现时需要按 JSON 路径区分语料层。

## 来源链接检查

链接存活检查不得作为每次单元测试的硬依赖，避免网络波动影响本地构建。可以提供独立的周期性命令：

```text
validate:sources-online
```

它只检查公开 URL 的状态和重定向，不下载受限内容，不自动更改 verificationStatus。任何状态更新必须进入人工审阅 PR。

## 输出格式

本地默认输出人类可读报告，CI 可增加 JSON：

```text
artifacts/validation/schema-report.json
artifacts/validation/reference-report.json
artifacts/validation/text-audit-report.json
```

报告属于构建产物，默认不提交仓库。

## 禁止行为

- 校验失败后自动修复正式知识文件
- 删除无法识别的字段来让 Schema 通过
- 将网络不可访问等同于来源内容错误
- 仅检查 JSON 能否解析而不检查业务引用
- 用前端 TypeScript 类型替代运行时 Schema
