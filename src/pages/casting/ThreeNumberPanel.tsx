import type { ReactElement } from "react";
import type { FormState } from "../../app/entry-form";
import type { FormUpdater } from "./casting-types";

interface ThreeNumberPanelProps {
  readonly form: FormState;
  readonly onUpdate: FormUpdater;
}

export default function ThreeNumberPanel({ form, onUpdate }: ThreeNumberPanelProps): ReactElement {
  return (
    <div className="casting-panel three-number-panel">
      <div className="form-grid three-columns">
        <label>第一个数<input id="three-number-first" aria-label="三数第一个数" inputMode="numeric" min="1" step="1" value={form.firstNumber} onChange={(event) => onUpdate("firstNumber", event.target.value)} /></label>
        <label>第二个数<input id="three-number-second" aria-label="三数第二个数" inputMode="numeric" min="1" step="1" value={form.secondNumber} onChange={(event) => onUpdate("secondNumber", event.target.value)} /></label>
        <label>第三个数<input id="three-number-third" aria-label="三数第三个数" inputMode="numeric" min="1" step="1" value={form.thirdNumber} onChange={(event) => onUpdate("thirdNumber", event.target.value)} /></label>
      </div>
      <p className="method-note"><strong>三数起课</strong>：只输入三个正整数。它是现代变通法，不把三数伪装成农历月、日、时，也不会改变传统月日时算法。</p>
    </div>
  );
}
