import type { FormEvent, ReactElement } from "react";
import type { KnowledgeDomain, KnowledgeStage } from "../../knowledge";
import { formatTimeZoneWarning, type CastingMode, type FormState } from "../../app/entry-form";
import CastingMethodSelector from "./CastingMethodSelector";
import CurrentTimePanel from "./CurrentTimePanel";
import SpecifiedTimePanel from "./SpecifiedTimePanel";
import ManualLunarPanel from "./ManualLunarPanel";
import ThreeNumberPanel from "./ThreeNumberPanel";
import QuestionContextPanel from "./QuestionContextPanel";
import type { CastingModeOption, FormUpdater } from "./casting-types";

interface CastingPageProps {
  readonly form: FormState;
  readonly domains: readonly KnowledgeDomain[];
  readonly stages: readonly KnowledgeStage[];
  readonly timeZones: readonly string[];
  readonly modeOptions: readonly CastingModeOption[];
  readonly flags: readonly { readonly id: string; readonly label: string }[];
  readonly error: string | null;
  readonly busy: boolean;
  readonly onUpdate: FormUpdater;
  readonly onModeChange: (mode: CastingMode) => void;
  readonly onDomainChange: (domainId: string) => void;
  readonly onToggleFlag: (flag: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onCurrentTimezoneChange: (value: string) => void;
  readonly onCurrentPolicyChange: (value: string) => void;
  readonly onSpecifiedPolicyChange: (value: string) => void;
}

export default function CastingPage({
  form,
  domains,
  stages,
  timeZones,
  modeOptions,
  flags,
  error,
  busy,
  onUpdate,
  onModeChange,
  onDomainChange,
  onToggleFlag,
  onSubmit,
  onCurrentTimezoneChange,
  onCurrentPolicyChange,
  onSpecifiedPolicyChange,
}: CastingPageProps): ReactElement {
  const selectedMode = modeOptions.find((option) => option.id === form.castingMode) ?? modeOptions[0];
  const timezoneWarning = formatTimeZoneWarning({ timeZone: form.currentTimezone, usedFallback: form.currentTimezoneFallback });
  return (
    <section className="casting-page" aria-labelledby="casting-heading">
      <header className="page-intro casting-intro">
        <div>
          <span className="section-kicker">01 · 起课方式</span>
          <h2 id="casting-heading">先确定输入，再查看结果</h2>
        </div>
        <span className="policy-chip">{selectedMode.label}</span>
        <p>{selectedMode.description}。方式切换不会清空其他模式的草稿。</p>
      </header>
      <CastingMethodSelector value={form.castingMode} options={modeOptions} onChange={onModeChange} />
      <form id="casting-input-panel" className="casting-form" onSubmit={onSubmit}>
        {form.castingMode === "current_civil_time" ? <CurrentTimePanel form={form} timeZones={timeZones} timezoneWarning={timezoneWarning} onUpdate={onUpdate} onTimezoneChange={onCurrentTimezoneChange} onPolicyChange={onCurrentPolicyChange} /> : null}
        {form.castingMode === "specified_civil_time" ? <SpecifiedTimePanel form={form} timeZones={timeZones} onUpdate={onUpdate} onPolicyChange={onSpecifiedPolicyChange} /> : null}
        {form.castingMode === "manual_lunar_time" ? <ManualLunarPanel form={form} onUpdate={onUpdate} /> : null}
        {form.castingMode === "three_number_variant" ? <ThreeNumberPanel form={form} onUpdate={onUpdate} /> : null}
        <div className="form-divider" />
        <QuestionContextPanel form={form} domains={domains} stages={stages} flags={flags} onUpdate={onUpdate} onDomainChange={onDomainChange} onToggleFlag={onToggleFlag} />
        {error ? <div className="error-box" role="alert">{error}</div> : null}
        <button id="generate-result-button" className="primary-button submit-button" type="submit" disabled={busy}>{busy ? "正在本地计算…" : "生成可复现结果"}</button>
      </form>
    </section>
  );
}

export type { CastingModeOption } from "./casting-types";
