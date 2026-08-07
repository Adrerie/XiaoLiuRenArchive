import type { ReactElement } from "react";
import type { DivinationResult } from "../../shared";
import { BlockSection } from "./result-helpers";

interface RealitySectionProps {
  readonly result: DivinationResult;
  readonly hardStop: boolean;
}

export default function RealitySection({ result, hardStop }: RealitySectionProps): ReactElement | null {
  const { actions, realityChecks } = result.interpretation.sections;
  if (!hardStop && actions.length === 0 && realityChecks.length === 0) return null;
  return (
    <section className={hardStop ? "result-section reality-section reality-first" : "result-section reality-section"} aria-labelledby="reality-section-heading">
      <div className="section-heading"><div><span className="section-kicker">现实行动</span><h3 id="reality-section-heading">先核对可执行事实</h3></div><span className="policy-chip">不由占断替代</span></div>
      {hardStop ? <p className="reality-lead">当前请求触发了现实安全边界。请先联系可信任的人、当地紧急服务或专业机构；传统计算不会改变这个优先级。</p> : null}
      {result.ethics.requiredRealityActionCodes.length > 0 ? <ul className="action-code-list">{result.ethics.requiredRealityActionCodes.map((code) => <li key={code}>{code}</li>)}</ul> : null}
      <BlockSection title="可执行的小步骤" blocks={actions} />
      <BlockSection title="现实核验" blocks={realityChecks} />
    </section>
  );
}
