import type { ReactElement } from "react";
import type { DivinationResult } from "../../shared";
import { BlockSection } from "./result-helpers";

export default function InterpretationSummary({ result }: { readonly result: DivinationResult }): ReactElement {
  return (
    <div className="interpretation-summary">
      <BlockSection title="中性象意" blocks={result.interpretation.sections.neutral} />
      <BlockSection title="当前领域解释" blocks={result.interpretation.sections.domain} />
      <BlockSection title="阶段提示" blocks={result.interpretation.sections.stage} />
      <BlockSection title="当前关系状态" blocks={result.interpretation.sections.relationshipCurrentState} />
    </div>
  );
}
