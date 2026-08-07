import type { ReactElement } from "react";
import type { DivinationResult } from "../../shared";
import { CALENDAR_POLICIES } from "../../calendar";
import { palaceLabel, resultDomainLabel } from "./result-helpers";

interface ResultHeroProps {
  readonly result: DivinationResult;
  readonly domains: readonly { readonly id: string; readonly name: string }[];
}

export default function ResultHero({ result, domains }: ResultHeroProps): ReactElement {
  const isThreeNumber = result.casting.kind === "three_numbers";
  let methodLabel = "传统报时起课";
  if (result.casting.kind === "three_numbers") methodLabel = "三数起课 · 现代变通法";
  if (result.casting.kind === "calendar") {
    const calendarCasting = result.casting as Extract<DivinationResult["casting"], { readonly kind: "calendar" }>;
    methodLabel = CALENDAR_POLICIES.find((policy) => policy.id === calendarCasting.calendarPolicyId)?.label ?? methodLabel;
  }
  return (
    <section className="result-hero" aria-labelledby="final-palace-result">
      <div>
        <span className="section-kicker">主结果 · {resultDomainLabel(result, domains)}</span>
        <h2 id="final-palace-result">{palaceLabel(result.calculation.finalPalaceId)}</h2>
        <p>{isThreeNumber ? "三数起课保留独立的现代变通路径；传统报时算法、解释片段与伦理规则不被混用。" : "传统计算、历法策略和解释片段均保留在本地结构化结果中。"}</p>
      </div>
      <div className="hero-tags"><span className="tag">{methodLabel}</span><span className="tag">本地结果</span></div>
    </section>
  );
}
