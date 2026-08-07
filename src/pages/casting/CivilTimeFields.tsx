import type { ReactElement } from "react";
import { CALENDAR_POLICIES, type CalendarPolicyId } from "../../calendar";
import type { FoldSelection } from "../../app/entry-form";

interface CivilTimeFieldsProps {
  readonly idPrefix: string;
  readonly includeDateTime: boolean;
  readonly localDateTime: string;
  readonly timezone: string;
  readonly fold: FoldSelection;
  readonly calendarPolicyId: Exclude<CalendarPolicyId, "manual-lunar-input-v1">;
  readonly timeZones: readonly string[];
  readonly timezoneWarning?: string | null;
  readonly onDateTimeChange: (value: string) => void;
  readonly onTimezoneChange: (value: string) => void;
  readonly onFoldChange: (value: FoldSelection) => void;
  readonly onPolicyChange: (value: string) => void;
}

function policyDefinition(policyId: string) {
  return CALENDAR_POLICIES.find((policy) => policy.id === policyId);
}

function foldOption(value: string): FoldSelection {
  return value === "0" || value === "1" ? value : "";
}

export default function CivilTimeFields({
  idPrefix,
  includeDateTime,
  localDateTime,
  timezone,
  fold,
  calendarPolicyId,
  timeZones,
  timezoneWarning,
  onDateTimeChange,
  onTimezoneChange,
  onFoldChange,
  onPolicyChange,
}: CivilTimeFieldsProps): ReactElement {
  const policy = policyDefinition(calendarPolicyId);
  return (
    <div className="civil-time-fields">
      <div className={includeDateTime ? "form-grid three-columns" : "form-grid two-columns"}>
        {includeDateTime ? (
          <label>
            本地日期时间
            <input id={`${idPrefix}-date-time`} type="datetime-local" step="60" value={localDateTime} onChange={(event) => onDateTimeChange(event.target.value)} />
          </label>
        ) : null}
        <label>
          IANA 时区
          <input id={`${idPrefix}-timezone`} list={`${idPrefix}-iana-time-zones`} type="search" placeholder="Asia/Shanghai" value={timezone} onChange={(event) => onTimezoneChange(event.target.value)} />
        </label>
        <label>
          重复时间选择
          <select id={`${idPrefix}-fold`} value={fold} onChange={(event) => onFoldChange(foldOption(event.target.value))}>
            <option value="">自动（非重复时间）</option>
            <option value="0">较早一次</option>
            <option value="1">较晚一次</option>
          </select>
        </label>
      </div>
      <datalist id={`${idPrefix}-iana-time-zones`}>
        {timeZones.map((timeZone) => <option value={timeZone} key={timeZone} />)}
      </datalist>
      <label className="calendar-policy-field">
        历法策略
        <select id={`${idPrefix}-calendar-policy`} value={calendarPolicyId} onChange={(event) => onPolicyChange(event.target.value)}>
          {CALENDAR_POLICIES.filter((item) => item.id !== "manual-lunar-input-v1").map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
      </label>
      {policy ? <p className="calendar-note">{policy.description} {policy.warning}</p> : null}
      {timezoneWarning ? <p className="calendar-warning" role="status">{timezoneWarning}</p> : null}
    </div>
  );
}
