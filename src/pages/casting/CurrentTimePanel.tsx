import type { ReactElement } from "react";
import type { FormState } from "../../app/entry-form";
import CivilTimeFields from "./CivilTimeFields";
import type { FormUpdater } from "./casting-types";

interface CurrentTimePanelProps {
  readonly form: FormState;
  readonly timeZones: readonly string[];
  readonly timezoneWarning: string | null;
  readonly onUpdate: FormUpdater;
  readonly onTimezoneChange: (value: string) => void;
  readonly onPolicyChange: (value: string) => void;
}

function currentTimeSummary(localDateTime: string, timeZone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u.exec(localDateTime);
  return match ? `${match[1]} 年 ${match[2]} 月 ${match[3]} 日 ${match[4]}:${match[5]}` : localDateTime;
}

export default function CurrentTimePanel({ form, timeZones, timezoneWarning, onUpdate, onTimezoneChange, onPolicyChange }: CurrentTimePanelProps): ReactElement {
  return (
    <div className="casting-panel current-time-panel">
      <div className="current-time-summary" aria-live="polite">
        <span className="section-kicker">设备当前时间</span>
        <strong id="current-time-summary">{currentTimeSummary(form.currentDateTime, form.currentTimezone)}</strong>
        <span className="current-time-zone">{form.currentTimezone}</span>
        <p>页面保持打开时会跟随设备时钟更新；再次点击“当前时间”也会立即重新读取设备时间和时区。</p>
      </div>
      <details className="advanced-settings">
        <summary>高级设置：时区、重复时间与历法策略</summary>
        <CivilTimeFields
          idPrefix="current-civil"
          includeDateTime={false}
          localDateTime={form.currentDateTime}
          timezone={form.currentTimezone}
          fold={form.currentFold}
          calendarPolicyId={form.currentCalendarPolicyId}
          timeZones={timeZones}
          timezoneWarning={timezoneWarning}
          onDateTimeChange={(value) => onUpdate("currentDateTime", value)}
          onTimezoneChange={onTimezoneChange}
          onFoldChange={(value) => onUpdate("currentFold", value)}
          onPolicyChange={onPolicyChange}
        />
      </details>
    </div>
  );
}
