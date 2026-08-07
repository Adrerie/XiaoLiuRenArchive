import type { ReactElement } from "react";
import type { KnowledgeDomain, KnowledgeStage } from "../../knowledge";
import type { FormState } from "../../app/entry-form";
import type { FormUpdater } from "./casting-types";

interface QuestionContextPanelProps {
  readonly form: FormState;
  readonly domains: readonly KnowledgeDomain[];
  readonly stages: readonly KnowledgeStage[];
  readonly flags: readonly { readonly id: string; readonly label: string }[];
  readonly onUpdate: FormUpdater;
  readonly onDomainChange: (domainId: string) => void;
  readonly onToggleFlag: (flag: string) => void;
}

export default function QuestionContextPanel({ form, domains, stages, flags, onUpdate, onDomainChange, onToggleFlag }: QuestionContextPanelProps): ReactElement {
  return (
    <section className="question-context-panel">
      <div className="form-grid two-columns">
        <label>问事领域<select value={form.domainId} onChange={(event) => onDomainChange(event.target.value)}>{domains.map((domain) => <option value={domain.id} key={domain.id}>{domain.name}</option>)}</select></label>
        <label>当前阶段（可选）<select value={form.stageId} onChange={(event) => onUpdate("stageId", event.target.value)}><option value="">不指定阶段</option>{stages.map((stage) => <option value={stage.id} key={stage.id}>{stage.label}</option>)}</select></label>
      </div>
      <fieldset>
        <legend>现实事实与安全确认</legend>
        <label className="checkbox-row"><input type="checkbox" checked={form.explicitRefusalExists} onChange={(event) => onUpdate("explicitRefusalExists", event.target.checked)} />对方已经明确拒绝、撤回或设置边界</label>
        <div className="flag-list">{flags.map((flag) => <label className="checkbox-row" key={flag.id}><input type="checkbox" checked={form.flags.includes(flag.id)} onChange={() => onToggleFlag(flag.id)} />{flag.label}</label>)}</div>
      </fieldset>
      <p className="privacy-note">隐私：不要求输入问题原文；本地结果默认不保存问题文本，也不会调用远程服务。</p>
    </section>
  );
}
