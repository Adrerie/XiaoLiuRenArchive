import type { ReactElement } from "react";
import type { DivinationResult } from "../../shared";
import { CALENDAR_POLICIES } from "../../calendar";

function branchLabel(id: string): string {
  const labels: Readonly<Record<string, string>> = { zi: "子", chou: "丑", yin: "寅", mao: "卯", chen: "辰", si: "巳", wu: "午", wei: "未", shen: "申", you: "酉", xu: "戌", hai: "亥" };
  return labels[id] ?? id;
}

export default function CalendarPath({ result }: { readonly result: DivinationResult }): ReactElement | null {
  if (result.calendar === null || result.input.kind !== "calendar") return null;
  const calendar = result.calendar;
  const lunar = calendar.resolvedLunarDate;
  const boundaryTrace = calendar.trace.find((entry) => entry.stage === "calendar-boundary");
  const conversionTime = typeof boundaryTrace?.lunarConversionLocalDateTime === "string" ? boundaryTrace.lunarConversionLocalDateTime : "手动输入";
  const policy = CALENDAR_POLICIES.find((item) => item.id === calendar.calendarPolicyId);
  return (
    <section className="result-section calendar-path">
      <div className="section-heading"><div><span className="section-kicker">历法路径</span><h3>转换后的历法输入</h3></div><span className="policy-chip">本地计算</span></div>
      <dl className="provenance-grid">
        <dt>输入模式</dt><dd>{result.input.inputMode === "civil_datetime" ? "公历时间" : "手动农历"}</dd>
        <dt>本地日期时间</dt><dd>{calendar.localDateTime ?? "手动输入"}</dd>
        <dt>时区</dt><dd>{calendar.timezone ?? "不适用（手动农历）"}</dd>
        <dt>转换农历</dt><dd>{lunar.month} 月 {lunar.day} 日{lunar.isLeapMonth ? "（闰月）" : ""}</dd>
        <dt>时辰</dt><dd>{branchLabel(calendar.earthlyBranch)}时</dd>
        <dt>日界调整</dt><dd>{calendar.boundaryDecision.appliedDayOffset}</dd>
        <dt>农历转换时刻</dt><dd>{conversionTime}</dd>
        <dt>历法策略</dt><dd>{policy?.label ?? calendar.calendarPolicyId}{policy?.description ? <p className="calendar-note">{policy.description}</p> : null}</dd>
      </dl>
      {calendar.warnings.map((warning) => <p className="calendar-warning" key={warning}>{warning}</p>)}
    </section>
  );
}
