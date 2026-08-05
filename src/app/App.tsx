import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { runLocalDivination } from "./index";
import { getSources, listDomains, listStages, type KnowledgeDomain } from "../knowledge";
import type { ContentBlock, DivinationResult, EarthlyBranch } from "../shared";

const PALACE_LABELS: Readonly<Record<string, string>> = {
  da_an: "大安", liu_lian: "留连", su_xi: "速喜", chi_kou: "赤口", xiao_ji: "小吉", kong_wang: "空亡",
};
const BRANCHES: readonly { readonly id: EarthlyBranch; readonly label: string; readonly index: number }[] = [
  { id: "zi", label: "子时（23:00–00:59）", index: 1 }, { id: "chou", label: "丑时（01:00–02:59）", index: 2 },
  { id: "yin", label: "寅时（03:00–04:59）", index: 3 }, { id: "mao", label: "卯时（05:00–06:59）", index: 4 },
  { id: "chen", label: "辰时（07:00–08:59）", index: 5 }, { id: "si", label: "巳时（09:00–10:59）", index: 6 },
  { id: "wu", label: "午时（11:00–12:59）", index: 7 }, { id: "wei", label: "未时（13:00–14:59）", index: 8 },
  { id: "shen", label: "申时（15:00–16:59）", index: 9 }, { id: "you", label: "酉时（17:00–18:59）", index: 10 },
  { id: "xu", label: "戌时（19:00–20:59）", index: 11 }, { id: "hai", label: "亥时（21:00–22:59）", index: 12 },
];
const FLAG_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: "third_party_identity", label: "涉及判断第三方性取向或性别身份" },
  { id: "medical_emergency", label: "存在医疗急症或需要立即求助" },
  { id: "death", label: "涉及死亡、寿命或终末结果" },
  { id: "missing_person", label: "人员失联并且存在现实危险" },
];

interface FormState {
  readonly lunarMonth: string;
  readonly lunarDay: string;
  readonly branchIndex: number;
  readonly isLeapMonth: boolean;
  readonly domainId: string;
  readonly stageId: string;
  readonly explicitRefusalExists: boolean;
  readonly flags: readonly string[];
}
const INITIAL_FORM: FormState = { lunarMonth: "3", lunarDay: "5", branchIndex: 5, isLeapMonth: false, domainId: "relationship", stageId: "seeking", explicitRefusalExists: false, flags: [] };

function palaceLabel(id: string): string { return PALACE_LABELS[id] ?? id; }
function readableError(error: unknown): string { return error instanceof Error ? error.message : "请求未能完成，请检查输入后重试。"; }

function BlockSection({ title, blocks }: { readonly title: string; readonly blocks: readonly ContentBlock[] }): ReactElement | null {
  if (blocks.length === 0) return null;
  return <section className="result-section"><div className="section-heading"><span className="section-kicker">LOCAL KNOWLEDGE</span><h3>{title}</h3></div><div className="content-stack">{blocks.map((block) => <article className="content-block" key={block.id}><p>{block.text}</p><div className="block-meta"><span>{block.status}</span><span>{block.id}</span></div></article>)}</div></section>;
}

function ResultPanel({ result }: { readonly result: DivinationResult }): ReactElement {
  const messages = [...(result.ethics.controlledMessages ?? [])];
  const sources = getSources(result.provenance.sourceIds);
  return <div className="result-area" aria-live="polite">
    {messages.length > 0 || result.ethics.mode !== "allow" ? <section className={`ethics-banner mode-${result.ethics.mode}`} role="alert"><div className="ethics-icon">!</div><div><span className="section-kicker">ETHICS GUARD · {result.ethics.mode}</span><h2>{result.ethics.mode === "hard_stop" ? "先处理现实安全，再查看传统解释" : result.ethics.mode === "hard_block" ? "此问题有明确的伦理边界" : "请保留现实核验和当事人意愿"}</h2>{messages.map((message) => <p key={message.id}>{message.text}</p>)}{result.ethics.requiredRealityActionCodes.length > 0 && <p className="action-code">现实行动：{result.ethics.requiredRealityActionCodes.join(" · ")}</p>}</div></section> : null}
    <section className="result-hero"><div><span className="section-kicker">FINAL PALACE · {result.input.domainId}</span><h2>{palaceLabel(result.calculation.finalPalaceId)}</h2><p>传统计算、历法策略和解释片段均保留在本地结构化结果中。</p></div><div className="hero-tags"><span className="tag">{result.calendar.calendarPolicyId}</span><span className="tag">{result.calculation.algorithmStatus}</span></div></section>
    <section className="result-section"><div className="section-heading"><span className="section-kicker">REPRODUCIBLE TRACE</span><h3>月、日、时推演路径</h3></div><div className="trace-grid">{result.calculation.trace.map((step, index) => <article className="trace-card" key={step.stage}><div className="trace-number">0{index + 1}</div><div><strong>{step.stage === "month" ? "月宫" : step.stage === "day" ? "日宫" : "时宫"}</strong><p>从 {palaceLabel(step.startPalaceId)} 起数 {step.countValue} 步，落在 <b>{palaceLabel(step.resultPalaceId)}</b></p><code>{step.formula}</code></div></article>)}</div></section>
    <BlockSection title="中性象意" blocks={result.interpretation.sections.neutral} /><BlockSection title="当前领域解释" blocks={result.interpretation.sections.domain} /><BlockSection title="阶段提示" blocks={result.interpretation.sections.stage} /><BlockSection title="可执行的小步骤" blocks={result.interpretation.sections.actions} /><BlockSection title="现实核验" blocks={result.interpretation.sections.realityChecks} /><BlockSection title="传统原典（与现代解释分开）" blocks={result.interpretation.sections.traditionalText} /><BlockSection title="历史语境" blocks={result.interpretation.sections.historicalContext} />
    <section className="result-section provenance"><div className="section-heading"><span className="section-kicker">PROVENANCE</span><h3>版本与来源</h3></div><dl className="provenance-grid"><dt>知识版本</dt><dd>{result.provenance.knowledgeVersion}</dd><dt>规则版本</dt><dd>{result.provenance.ruleVersion}</dd><dt>片段</dt><dd>{result.provenance.fragmentIds.length} 个本地片段</dd><dt>伦理规则</dt><dd>{result.provenance.ethicsRuleIds.length} 条命中</dd></dl><div className="source-list">{sources.map((source) => <a className="source-card" href={source.url ?? undefined} target={source.url ? "_blank" : undefined} rel={source.url ? "noreferrer" : undefined} key={source.id}><strong>{source.title}</strong><span>{source.verificationStatus} · {source.id}</span></a>)}</div></section>
  </div>;
}

export default function App(): ReactElement {
  const domains = useMemo<readonly KnowledgeDomain[]>(() => listDomains(), []);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedDomain = domains.find((domain) => domain.id === form.domainId) ?? domains[0];
  const stages = selectedDomain ? listStages(selectedDomain.id) : [];

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void { setForm((current) => ({ ...current, [key]: value })); }
  function toggleFlag(flag: string): void { update("flags", form.flags.includes(flag) ? form.flags.filter((item) => item !== flag) : [...form.flags, flag]); }
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const lunarMonth = Number(form.lunarMonth); const lunarDay = Number(form.lunarDay);
      if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error("农历月必须是 1–12 的整数。");
      if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) throw new Error("农历日必须是 1–30 的整数。");
      const nextResult = await runLocalDivination({
        requestVersion: "1.0.0", inputMode: "manual_lunar", calendarPolicyId: "manual-lunar-input-v1",
        timeInput: { kind: "manual_lunar", lunarMonth, lunarDay, earthlyBranchIndex: form.branchIndex, isLeapMonth: form.isLeapMonth },
        questionContext: { domainId: form.domainId, stageId: form.stageId || null, flags: form.flags, facts: { explicitRefusalExists: form.explicitRefusalExists, immediateSafetyRisk: form.flags.includes("missing_person") }, privacy: { questionTextStored: false, questionTextIncludedInExport: false } },
        displayPreferences: { language: "zh-CN", showTraditionalText: true, showSourceTrace: true, showCalculationTrace: true },
      });
      setResult(nextResult);
    } catch (submissionError) { setError(readableError(submissionError)); setResult(null); } finally { setBusy(false); }
  }

  return <main className="app-shell">
    <header className="app-header"><div><span className="eyebrow">XiaoLiuRenArchive · R1 LOCAL WEB MVP</span><h1>小六壬档案</h1><p className="lede">把输入、历法、传统计算、本地知识与现实边界放在同一条可复现路径上。</p></div><div className="offline-badge"><span />本地运行 · 不上传问题</div></header>
    <section className="input-card"><div className="card-heading"><div><span className="section-kicker">01 · MANUAL LUNAR INPUT</span><h2>开始一课</h2></div><span className="policy-chip">manual-lunar-input-v1</span></div><p className="helper">第一版优先使用手动农历。系统只把农历月、日和时辰序号交给冻结的传统计算核心。</p><form onSubmit={submit}><div className="form-grid three-columns"><label>农历月<input inputMode="numeric" min="1" max="12" value={form.lunarMonth} onChange={(event) => update("lunarMonth", event.target.value)} /></label><label>农历日<input inputMode="numeric" min="1" max="30" value={form.lunarDay} onChange={(event) => update("lunarDay", event.target.value)} /></label><label>十二时辰<select value={form.branchIndex} onChange={(event) => update("branchIndex", Number(event.target.value))}>{BRANCHES.map((branch) => <option value={branch.index} key={branch.id}>{branch.label}</option>)}</select></label></div><label className="checkbox-row"><input type="checkbox" checked={form.isLeapMonth} onChange={(event) => update("isLeapMonth", event.target.checked)} />这是闰月（沿用当前月份数字参与计算）</label><div className="form-divider" /><div className="form-grid two-columns"><label>问事领域<select value={form.domainId} onChange={(event) => { const domainId = event.target.value; const nextStages = listStages(domainId); setForm((current) => ({ ...current, domainId, stageId: nextStages[0] ?? "" })); }}>{domains.map((domain) => <option value={domain.id} key={domain.id}>{domain.name}</option>)}</select></label><label>当前阶段（可选）<select value={form.stageId} onChange={(event) => update("stageId", event.target.value)}><option value="">不指定阶段</option>{stages.map((stage) => <option value={stage} key={stage}>{stage}</option>)}</select></label></div><fieldset><legend>现实事实与安全确认</legend><label className="checkbox-row"><input type="checkbox" checked={form.explicitRefusalExists} onChange={(event) => update("explicitRefusalExists", event.target.checked)} />对方已经明确拒绝、撤回或设置边界</label><div className="flag-list">{FLAG_OPTIONS.map((flag) => <label className="checkbox-row" key={flag.id}><input type="checkbox" checked={form.flags.includes(flag.id)} onChange={() => toggleFlag(flag.id)} />{flag.label}</label>)}</div></fieldset><p className="privacy-note">隐私：此界面不要求问题原文；本地结果默认不保存问题文本，也不会调用远程服务。</p>{error && <div className="error-box" role="alert">{error}</div>}<button className="primary-button" type="submit" disabled={busy}>{busy ? "正在本地计算…" : "生成可复现结果"}</button></form></section>
    {result ? <ResultPanel result={result} /> : <section className="empty-state"><span className="section-kicker">02 · RESULT</span><h2>结果会在这里展开</h2><p>提交后可查看最终宫位、三步 trace、本地解释、原典来源和伦理提示。</p></section>}
    <footer className="app-footer">传统计算为固定规则的文化解释，不构成医疗、法律或财务意见。</footer>
  </main>;
}
