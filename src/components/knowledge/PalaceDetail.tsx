import type { ReactElement } from "react";
import type { KnowledgeDomain, KnowledgeSource, PalaceKnowledge } from "../../knowledge";
import { SourceCard } from "./SourceCard";
import { knowledgeStatusLabel, traditionalPolarityLabel } from "./knowledge-labels";

function Field({ label, value, status }: { readonly label: string; readonly value: string; readonly status: string }): ReactElement {
  return <div className="knowledge-field"><span>{label}</span><strong>{value}</strong><small>资料状态：{knowledgeStatusLabel(status)}</small></div>;
}

export function PalaceDetail({
  palace,
  domains,
  sources,
}: {
  readonly palace: PalaceKnowledge;
  readonly domains: readonly KnowledgeDomain[];
  readonly sources: readonly KnowledgeSource[];
}): ReactElement {
  return (
    <article className="palace-detail" id="palace-detail">
      <header className="palace-detail-header">
        <div>
          <span className="section-kicker">宫位 {String(palace.order + 1).padStart(2, "0")}</span>
          <h2>{palace.name}</h2>
          <p>{palace.neutralSummary}</p>
        </div>
        <div className="hero-tags">
          <span className="tag">五行 {palace.element}</span>
          <span className="tag">六神 {palace.spirit}</span>
          <span className="tag">传统倾向：{traditionalPolarityLabel(palace.traditionalPolarity)}</span>
        </div>
      </header>

      <section className="knowledge-subsection">
        <div className="section-heading"><h3>概览</h3></div>
        <div className="knowledge-field-grid">
          <Field label="五行" value={palace.element} status={palace.elementStatus} />
          <Field label="六神" value={palace.spirit} status={palace.spiritStatus} />
          <Field label="状态词" value={palace.statePhrase} status={palace.statePhraseStatus} />
        </div>
        <div className="tag-list">
          {palace.primaryTags.map((tag) => <span className="tag" key={`primary-${tag}`}>{tag}</span>)}
          {palace.riskTags.map((tag) => <span className="tag tag-risk" key={`risk-${tag}`}>{tag}</span>)}
        </div>
      </section>

      <section className="knowledge-subsection">
        <div className="section-heading"><h3>原典记录</h3></div>
        <div className="content-block">
          <p>{palace.traditionalText}</p>
          <div className="block-meta"><span>资料状态：{knowledgeStatusLabel(palace.traditionalStatus)}</span><span>依据：{palace.traditionalSourceIds.length} 条本地来源</span></div>
        </div>
      </section>

      <section className="knowledge-subsection">
        <div className="section-heading"><h3>现代解读</h3></div>
        <div className="knowledge-reading-grid">
          <div className="content-block"><strong>总结</strong><p>{palace.modernSummary}</p></div>
          <div className="content-block"><strong>支持性阅读</strong><p>{palace.supportiveReading}</p></div>
          <div className="content-block"><strong>现实边界</strong><p>{palace.cautionReading}</p></div>
        </div>
        <ul className="knowledge-list">{palace.realityChecks.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="knowledge-subsection">
        <div className="section-heading"><h3>问事领域</h3></div>
        <div className="domain-reading-list">
          {domains.map((domain) => {
            const reading = domain.palaceInterpretations[palace.id];
            if (!reading) return null;
            return (
              <article className="domain-reading-card" key={domain.id}>
                <div className="knowledge-source-heading"><strong>{domain.name}</strong><span className="domain-reading-label">本地指引</span></div>
                <p>{reading.summary}</p>
                <p className="helper">{reading.supportive}</p>
                <p className="calendar-warning">边界：{reading.caution}</p>
                <ul className="knowledge-list">{reading.actionPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="knowledge-subsection">
        <div className="section-heading"><h3>异文记录</h3></div>
        {palace.elementVariants.length === 0 && palace.statePhraseVariants.length === 0 ? (
          <p className="knowledge-empty-note">当前未登记单独异文。</p>
        ) : (
          <div className="variant-list">
            {palace.elementVariants.map((variant) => (
              <div className="variant-card" key={`element-${variant.value}`}><strong>五行：{variant.value}</strong><span>异文状态：{knowledgeStatusLabel(variant.status)} · 来源 {variant.sourceIds.length} 条</span><p>{variant.note ?? "已登记异文，暂未作为基准值使用。"}</p></div>
            ))}
            {palace.statePhraseVariants.map((variant) => (
              <div className="variant-card" key={`state-${variant.value}`}><strong>状态词：{variant.value}</strong><span>异文状态：{knowledgeStatusLabel(variant.status)} · 来源 {variant.sourceIds.length} 条</span><p>{variant.note ?? "已登记异文，暂未作为基准值使用。"}</p></div>
            ))}
          </div>
        )}
        {palace.reviewNotes.map((note) => <p className="helper" key={note}>审查备注：{note}</p>)}
      </section>

      <section className="knowledge-subsection">
        <div className="section-heading"><h3>资料来源</h3></div>
        <div className="source-list knowledge-source-list">{sources.map((source) => <SourceCard source={source} key={source.id} />)}</div>
      </section>
    </article>
  );
}
