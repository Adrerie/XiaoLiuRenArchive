import { useMemo, useState, type ReactElement } from "react";
import type { DivinationResult } from "../shared";
import { serializeExportPayload } from "./result-export";
import { copyExportJson, saveOrShareExportJson } from "../platform/export-result";

function IdList({ values }: { readonly values: readonly string[] }): ReactElement {
  return <code>{values.length > 0 ? values.join(" · ") : "（无）"}</code>;
}

interface StructuredDetailsProps {
  readonly result: DivinationResult;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function StructuredDetails({ result, open, onOpenChange }: StructuredDetailsProps): ReactElement {
  const calendar = result.calendar;
  const boundaryTrace = calendar?.trace.find((entry) => entry.stage === "calendar-boundary");
  const lunarConversionLocalDateTime = typeof boundaryTrace?.lunarConversionLocalDateTime === "string"
    ? boundaryTrace.lunarConversionLocalDateTime
    : "手动输入";
  return (
    <section className="result-section structured-details">
      <details id="structured-details" open={open} onToggle={(event) => onOpenChange(event.currentTarget.open)}>
        <summary>结构化详情（技术 ID 默认折叠）</summary>
        <dl className="provenance-grid detail-grid">
          <dt>casting.kind</dt><dd><code>{result.casting.kind}</code></dd>
          <dt>algorithmId</dt><dd><code>{result.calculation.algorithmId}</code></dd>
          {calendar ? (
            <>
              <dt>calendarPolicyId</dt><dd><code>{calendar.calendarPolicyId}</code></dd>
              <dt>appliedDayOffset</dt><dd><code>{calendar.boundaryDecision.appliedDayOffset}</code></dd>
              <dt>lunarConversionLocalDateTime</dt><dd><code>{lunarConversionLocalDateTime}</code></dd>
            </>
          ) : (
            <>
              <dt>threeNumbers</dt>
              <dd><code>{result.casting.kind === "three_numbers" ? [result.casting.input.first, result.casting.input.second, result.casting.input.third].join(", ") : "不适用"}</code></dd>
            </>
          )}
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
  const hasCalendarTime = result.input.kind === "calendar";
  const [includePreciseTime, setIncludePreciseTime] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const serialized = useMemo(
    () => serializeExportPayload(result, { includePreciseTime }),
    [includePreciseTime, result],
  );

  async function copyJson(): Promise<void> {
    const action = await copyExportJson(serialized);
    setStatus(action.message);
  }

  async function saveOrShareJson(): Promise<void> {
    const action = await saveOrShareExportJson(serialized);
    setStatus(action.message);
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
      <p className="helper">默认移除精确本地时间和问题原文；{hasCalendarTime ? "历法策略、" : ""}计算 trace、版本与来源仍会保留。</p>
      {hasCalendarTime ? (
        <label className="checkbox-row export-time-option">
          <input type="checkbox" checked={includePreciseTime} onChange={(event) => setIncludePreciseTime(event.target.checked)} />
          包含精确时间（仅在本次导出中）
        </label>
      ) : null}
      <div className="export-actions">
        <button id="copy-json-button" type="button" className="secondary-button" onClick={() => void copyJson()}>复制 JSON</button>
        <button id="save-share-json-button" type="button" className="secondary-button" onClick={() => void saveOrShareJson()}>保存/分享 JSON</button>
      </div>
      {status ? <p id="export-status" className="export-status" role="status">{status}</p> : null}
    </section>
  );
}
