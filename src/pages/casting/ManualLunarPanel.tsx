import type { ReactElement } from "react";
import type { FormState } from "../../app/entry-form";
import type { FormUpdater } from "./casting-types";

const BRANCHES: readonly { readonly label: string; readonly index: number }[] = [
  { label: "子时（23:00–00:59）", index: 1 },
  { label: "丑时（01:00–02:59）", index: 2 },
  { label: "寅时（03:00–04:59）", index: 3 },
  { label: "卯时（05:00–06:59）", index: 4 },
  { label: "辰时（07:00–08:59）", index: 5 },
  { label: "巳时（09:00–10:59）", index: 6 },
  { label: "午时（11:00–12:59）", index: 7 },
  { label: "未时（13:00–14:59）", index: 8 },
  { label: "申时（15:00–16:59）", index: 9 },
  { label: "酉时（17:00–18:59）", index: 10 },
  { label: "戌时（19:00–20:59）", index: 11 },
  { label: "亥时（21:00–22:59）", index: 12 },
];

interface ManualLunarPanelProps {
  readonly form: FormState;
  readonly onUpdate: FormUpdater;
}

export default function ManualLunarPanel({ form, onUpdate }: ManualLunarPanelProps): ReactElement {
  return (
    <div className="casting-panel manual-lunar-panel">
      <div className="form-grid three-columns">
        <label>农历月<input id="lunar-month-input" aria-label="农历月" inputMode="numeric" min="1" max="12" value={form.lunarMonth} onChange={(event) => onUpdate("lunarMonth", event.target.value)} /></label>
        <label>农历日<input id="lunar-day-input" aria-label="农历日" inputMode="numeric" min="1" max="30" value={form.lunarDay} onChange={(event) => onUpdate("lunarDay", event.target.value)} /></label>
        <label>十二时辰<select id="earthly-branch-select" aria-label="十二时辰" value={form.branchIndex} onChange={(event) => onUpdate("branchIndex", Number(event.target.value))}>{BRANCHES.map((branch) => <option value={branch.index} key={branch.index}>{branch.label}</option>)}</select></label>
      </div>
      <label className="checkbox-row"><input type="checkbox" checked={form.isLeapMonth} onChange={(event) => onUpdate("isLeapMonth", event.target.checked)} />这是闰月（沿用当前月份数字参与计算）</label>
    </div>
  );
}
