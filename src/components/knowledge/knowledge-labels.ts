const STATUS_LABELS: Readonly<Record<string, string>> = {
  provisional: "暂定",
  reviewed: "已复核",
  canonical: "已确认",
  disputed: "存在异文",
  verified: "已核验",
  "verified-url": "链接已核验",
  unverified: "未核验",
  attested: "有出处",
  reported: "转录记录",
  rejected: "不采用",
};

const INGESTION_POLICY_LABELS: Readonly<Record<string, string>> = {
  "metadata-and-short-citation-only": "仅记录书目信息与短引文",
  "manual-collation-required": "需人工校对",
  "catalog-metadata-only": "仅记录目录信息",
  "comparison-only": "仅用于版本对照",
  "local-fulltext-permitted": "允许本地全文使用",
};

const POLARITY_LABELS: Readonly<Record<string, string>> = {
  auspicious: "偏吉",
  inauspicious: "偏凶",
  neutral: "中性",
};

const KNOWLEDGE_TEXT_LABELS: Readonly<Record<string, string>> = {
  "XiaoLiuRenArchive editorial modern knowledge": "项目现代知识",
  "XiaoLiuRenArchive project": "项目组",
  "project-authored modern neutral interpretations": "项目编写的现代中性解释",
  "question-domain templates and action prompts": "问事领域模板与行动提示",
  "reality boundaries and ethics-aware rewrites": "现实边界与伦理守护改写",
  "historical context explanations": "历史背景说明",
  "traditional author attribution": "传统作者归属",
  "classical text collation or unique canon": "原典校勘或唯一标准",
  "scientific validity": "科学有效性",
  "guaranteed prediction": "保证式预测",
  "Project-authored and locally reviewed editorial content.": "项目编写并在本地复核的编辑内容。",
};

export function knowledgeStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? "待确认";
}

export function ingestionPolicyLabel(policy: string): string {
  return INGESTION_POLICY_LABELS[policy] ?? "登记规则待说明";
}

export function traditionalPolarityLabel(polarity: string): string {
  return POLARITY_LABELS[polarity] ?? "传统倾向待确认";
}

export function knowledgeDisplayText(text: string): string {
  return KNOWLEDGE_TEXT_LABELS[text] ?? text;
}
