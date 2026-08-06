import type { ReactElement } from "react";
import type { KnowledgeSource } from "../../knowledge";
import { ExternalSourceLink } from "./ExternalSourceLink";

export function SourceCard({ source }: { readonly source: KnowledgeSource }): ReactElement {
  return (
    <article className="knowledge-source-card">
      <div className="knowledge-source-heading">
        <strong>{source.title}</strong>
        <span className="status-pill">{source.verificationStatus}</span>
      </div>
      <p>{source.publisher} · {source.ingestionPolicy}</p>
      <div className="knowledge-source-columns">
        <div><span>支持范围</span><ul>{source.supports.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><span>不支持</span><ul>{source.doesNotSupport.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
      <small>{source.licenseNote}</small>
      {source.url ? <ExternalSourceLink href={source.url}>打开外部来源</ExternalSourceLink> : null}
    </article>
  );
}
