import type { ReactElement } from "react";
import type { DivinationResult } from "../../shared";
import { palaceLabel } from "./result-helpers";

export default function ThreePalaceFlow({ result }: { readonly result: DivinationResult }): ReactElement | null {
  if (result.calculation.algorithmId !== "three-number-sequential-count-v1") return null;
  return (
    <section className="result-section three-palace-flow" aria-labelledby="three-palace-heading">
      <div className="section-heading">
        <div><span className="section-kicker">三宫路径</span><h3 id="three-palace-heading">第三宫为当前主判</h3></div>
        <span className="policy-chip">第三宫 · 主判</span>
      </div>
      <div className="palace-flow" aria-label="三宫起课路径">
        {result.calculation.threePalaces.map((palace) => (
          <article className={palace.ordinal === 3 ? "palace-flow-step palace-flow-primary" : "palace-flow-step"} key={palace.ordinal}>
            <span className="path-ordinal">第 {palace.ordinal} 宫{palace.ordinal === 3 ? " · 主判" : ""}</span>
            <strong>{palaceLabel(palace.palaceId)}</strong>
            <span>输入 {palace.rawNumber} · 余数 {palace.normalizedOffset}</span>
          </article>
        ))}
      </div>
      <p className="helper">第一宫是起始状态，第二宫是发展过程，第三宫是当前主态；这只是本地登记的现代编排，不代表所有流派的统一解释。</p>
    </section>
  );
}
