import type { ReactElement } from "react";
import type { ArchiveStorageCapability } from "../../archive";
import type { DivinationResult, ContentBlock } from "../../shared";
import { ExternalSourceLink } from "../../components/knowledge/ExternalSourceLink";
import { getSources } from "../../knowledge";
import { ExportPanel, StructuredDetails } from "../../app/ResultTools";
import ResultHero from "./ResultHero";
import ThreePalaceFlow from "./ThreePalaceFlow";
import CalendarPath from "./CalendarPath";
import InterpretationSummary from "./InterpretationSummary";
import RealitySection from "./RealitySection";
import TechnicalDisclosure from "./TechnicalDisclosure";
import { BlockSection, palaceLabel } from "./result-helpers";

interface ResultViewProps {
  readonly result: DivinationResult;
  readonly domains: readonly { readonly id: string; readonly name: string }[];
  readonly technicalDisclosureOpen: boolean;
  readonly structuredDetailsOpen: boolean;
  readonly archiveStatus: string | null;
  readonly archiveCapability: ArchiveStorageCapability;
  readonly onTechnicalDisclosureOpenChange: (open: boolean) => void;
  readonly onStructuredDetailsOpenChange: (open: boolean) => void;
  readonly onSaveToArchive: () => void;
}

function statusLabel(status: string): string {
  const labels: Readonly<Record<string, string>> = { attested: "已见文本", reported: "转录记录", provisional: "试行来源", unverified: "待核验", rejected: "不采用" };
  return labels[status] ?? "已登记来源";
}

function TraceSection({ result }: { readonly result: DivinationResult }): ReactElement {
  const calculation = result.calculation;
  const isThreeNumber = calculation.algorithmId === "three-number-sequential-count-v1";
  const trace = calculation.trace;
  return (
    <section className="result-section trace-section">
      <div className="section-heading"><div><span className="section-kicker">可复现路径</span><h3>{isThreeNumber ? "三数起课推演路径" : "月、日、时推演路径"}</h3></div></div>
      <div className="trace-grid">
        {trace.map((step, index) => (
          <article className="trace-card" key={step.stage}>
            <div className="trace-number">0{index + 1}</div>
            <div>
              <strong>{isThreeNumber ? ({ first_number: "三数第一步", second_number: "三数第二步", third_number: "三数第三步" } as Record<string, string>)[step.stage] : ({ month: "月宫", day: "日宫", hour: "时宫" } as Record<string, string>)[step.stage]}</strong>
              <p>从 {palaceLabel(step.startPalaceId)} 起数 {step.countValue} 步，落在 <b>{palaceLabel(step.resultPalaceId)}</b></p>
              <code>{isThreeNumber && "normalizedOffset" in step ? `取模余数：${step.normalizedOffset}` : "按六宫顺序从起点连续计数"}</code>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProvenanceSection({ result }: { readonly result: DivinationResult }): ReactElement {
  const sources = getSources(result.provenance.sourceIds);
  return (
    <>
      <BlockSection title="传统原典（与现代解释分开）" blocks={result.interpretation.sections.traditionalText} />
      <BlockSection title="历史语境" blocks={result.interpretation.sections.historicalContext} />
      <section className="result-section provenance">
        <div className="section-heading"><div><span className="section-kicker">来源追踪</span><h3>版本与来源</h3></div></div>
        <dl className="provenance-grid"><dt>知识版本</dt><dd>{result.provenance.knowledgeVersion}</dd><dt>规则版本</dt><dd>{result.provenance.ruleVersion}</dd><dt>片段</dt><dd>{result.provenance.fragmentIds.length} 个本地片段</dd><dt>伦理规则</dt><dd>{result.provenance.ethicsRuleIds.length} 条</dd></dl>
        <div className="source-list">{sources.map((source) => source.url ? <ExternalSourceLink className="source-card" href={source.url} key={source.id}><strong>{source.title}</strong><span>{statusLabel(source.verificationStatus)}</span></ExternalSourceLink> : <span className="source-card" key={source.id}><strong>{source.title}</strong><span>{statusLabel(source.verificationStatus)}</span></span>)}</div>
      </section>
    </>
  );
}

function EthicsBanner({ result }: { readonly result: DivinationResult }): ReactElement | null {
  if (result.ethics.requiredNotices.length === 0 && result.ethics.mode === "allow") return null;
  const hardStop = result.ethics.stopPrimaryDivination;
  return (
    <section className={`ethics-banner mode-${result.ethics.mode}`} role="alert">
      <div className="ethics-icon">!</div>
      <div className="ethics-messages">
        <span className="section-kicker">安全边界 · {hardStop ? "立即停止" : result.ethics.mode === "hard_block" ? "需要边界" : "保留核验"}</span>
        <h2>{hardStop ? "先处理现实安全，再查看传统解释" : result.ethics.mode === "hard_block" ? "此问题有明确的伦理边界" : "请保留现实核验和当事人意愿"}</h2>
        {result.ethics.requiredNotices.map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}
      </div>
    </section>
  );
}

export default function ResultView({
  result,
  domains,
  technicalDisclosureOpen,
  structuredDetailsOpen,
  archiveStatus,
  archiveCapability,
  onTechnicalDisclosureOpenChange,
  onStructuredDetailsOpenChange,
  onSaveToArchive,
}: ResultViewProps): ReactElement {
  const hardStop = result.ethics.stopPrimaryDivination;
  return (
    <div className="result-area" aria-live="polite">
      <EthicsBanner result={result} />
      {!hardStop ? <ResultHero result={result} domains={domains} /> : null}
      {!hardStop ? <InterpretationSummary result={result} /> : null}
      {!hardStop ? <CalendarPath result={result} /> : null}
      {!hardStop ? <ThreePalaceFlow result={result} /> : null}
      <RealitySection result={result} hardStop={hardStop} />
      <TechnicalDisclosure open={technicalDisclosureOpen} hardStop={hardStop} onOpenChange={onTechnicalDisclosureOpenChange}>
        {hardStop ? <><CalendarPath result={result} /><ThreePalaceFlow result={result} /></> : null}
        <TraceSection result={result} />
        <StructuredDetails result={result} open={structuredDetailsOpen} onOpenChange={onStructuredDetailsOpenChange} />
        <ExportPanel result={result} />
        <section className="result-section result-actions" aria-labelledby="archive-save-heading">
          <div className="section-heading"><div><span className="section-kicker">本地案例库</span><h3 id="archive-save-heading">只在明确保存后记录</h3></div><button type="button" className="secondary-button" disabled={!archiveCapability.available} onClick={onSaveToArchive}>保存到案例库</button></div>
          <p className="helper">默认不保存问题原文，不上传、不云同步。{archiveCapability.message ?? ""}</p>
          {archiveStatus ? <p className="export-status" role="status">{archiveStatus}</p> : null}
        </section>
        {!hardStop ? <ProvenanceSection result={result} /> : null}
      </TechnicalDisclosure>
    </div>
  );
}

export type { ContentBlock };
