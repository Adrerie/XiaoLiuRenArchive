import { useMemo, useState, type ReactElement } from "react";
import type { DivinationResult } from "../shared";
import { serializeExportPayload } from "./result-export";

function IdList({ values }: { readonly values: readonly string[] }): ReactElement {
  return <code>{values.length > 0 ? values.join(" · ") : "（无）"}</code>;
}

export function StructuredDetails({ result }: { readonly result: DivinationResult }): ReactElement {
  const boundaryTrace = result.calendar.trace.find((entry) => entry.stage === "calendar-boundary");
  const lunarConversionLocalDateTime = typeof boundaryTrace?.lunarConversionLocalDateTime === "string"
    ? boundaryTrace.lunarConversionLocalDateTime
    : "manual input";
  return (
    <section className="result-section structured-details">
      <details>
        <summary>结构化详情（技术 ID 默认折叠）</summary>
        <dl className="provenance-grid detail-grid">
          <dt>algorithmId</dt><dd><code>{result.calculation.algorithmId}</code></dd>
          <dt>calendarPolicyId</dt><dd><code>{result.calendar.calendarPolicyId}</code></dd>
          <dt>appliedDayOffset</dt><dd><code>{result.calendar.boundaryDecision.appliedDayOffset}</code></dd>
          <dt>lunarConversionLocalDateTime</dt><dd><code>{lunarConversionLocalDateTime}</code></dd>
          <dt>knowledgeVersion</dt><dd><code>{result.provenance.knowledgeVersion}</code></dd>
          <dt>ruleVersion</dt><dd><code>{result.provenance.ruleVersion}</code></dd>
          <dt>finalPalaceId</dt><dd><code>{result.calculation.finalPalaceId}</code></dd>
          <dt>domainId</dt><dd><code>{result.interpretation.domainId}</code></dd>
          <dt>stageId</dt><dd><code>{result.interpretation.stageId ?? "null"}</code></dd>
          <dt>fragmentIds</dt><dd><IdList values={result.provenance.fragmentIds} /></dd>
          <dt>ethicsRuleIds</dt><dd><IdList values={result.provenance.ethicsRuleIds} /></dd>
          <dt>sourceIds</dt><dd><IdList values={result.provenance.sourceIds} /></dd>
          <dt>disputedFieldIds</dt><dd><IdList values={result.provenance.disputedFieldIds} /></dd>
        </dl>
      </details>
    </section>
  );
}

export function ExportPanel({ result }: { readonly result: DivinationResult }): ReactElement {
  const [includePreciseTime, setIncludePreciseTime] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const serialized = useMemo(
    () => serializeExportPayload(result, { includePreciseTime }),
    [includePreciseTime, result],
  );

  async function copyJson(): Promise<void> {
    try {
      await navigator.clipboard.writeText(serialized);
      setStatus("JSON 已复制到剪贴板。");
    } catch {
      setStatus("复制失败，请改用下载。");
    }
  }

  function downloadJson(): void {
    const blob = new Blob([serialized], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "xiaoliuren-result.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("JSON 已下载到本地。");
  }

  return (
    <section className="result-section export-panel">
      <div className="section-heading">
        <div>
          <span className="section-kicker">LOCAL EXPORT</span>
          <h3>隐私优先 JSON</h3>
        </div>
        <span className="policy-chip">不上传</span>
      </div>
      <p className="helper">默认移除精确本地时间和问题原文；历法策略、计算 trace、版本与来源仍会保留。</p>
      <label className="checkbox-row export-time-option">
        <input type="checkbox" checked={includePreciseTime} onChange={(event) => setIncludePreciseTime(event.target.checked)} />
        包含精确时间（仅在本次导出中）
      </label>
      <div className="export-actions">
        <button type="button" className="secondary-button" onClick={() => void copyJson()}>复制 JSON</button>
        <button type="button" className="secondary-button" onClick={downloadJson}>下载 .json</button>
      </div>
      {status ? <p className="export-status" role="status">{status}</p> : null}
    </section>
  );
}
