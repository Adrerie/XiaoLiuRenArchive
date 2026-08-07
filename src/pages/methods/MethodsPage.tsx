import type { ReactElement } from "react";
import { listCastingMethods } from "../../knowledge";

export default function MethodsPage(): ReactElement {
  const methods = listCastingMethods();
  return (
    <section className="methods-page">
      <header className="page-intro">
        <span className="section-kicker">起课方法</span>
        <h2>起课方法说明</h2>
        <p>每种方法都登记输入、路径、主判位置和不支持的主张。技术编号只在详情中保留，普通使用以中文名称为准。</p>
      </header>
      <div className="method-list">
        {methods.map((method) => (
          <article className="result-section method-card" key={method.id}>
            <div className="section-heading">
              <div>
                <span className="section-kicker">{method.category === "traditional-core" ? "传统核心" : "现代变通法"}</span>
                <h3>{method.name}</h3>
              </div>
              <span className="status-pill">{method.sourceStatus === "provisional" ? "试行登记" : "已登记"}</span>
            </div>
            <p>{method.ruleSummary}</p>
            <dl className="provenance-grid">
              <dt>输入</dt><dd>{method.inputKind === "calendar" ? "历法月、日、时辰" : "三个正整数"}</dd>
              <dt>主判</dt><dd>{method.primaryPalacePosition === "third" ? "第三宫" : "时宫"}</dd>
              <dt>版本</dt><dd>{method.version}</dd>
            </dl>
            <details className="technical-details">
              <summary>技术登记</summary>
              <dl className="provenance-grid detail-grid">
                <dt>方法 ID</dt><dd><code>{method.id}</code></dd>
                <dt>路径字段</dt><dd><code>{method.pathFields.join(" · ")}</code></dd>
                <dt>支持层</dt><dd>{method.supportedInterpretationLayers.join("、")}</dd>
                <dt>不支持主张</dt><dd>{method.unsupportedClaims.join("、")}</dd>
              </dl>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
