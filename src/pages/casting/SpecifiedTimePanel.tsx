import type { ReactElement } from "react";
import type { FormState } from "../../app/entry-form";
import CivilTimeFields from "./CivilTimeFields";
import type { FormUpdater } from "./casting-types";

interface SpecifiedTimePanelProps {
  readonly form: FormState;
  readonly timeZones: readonly string[];
  readonly onUpdate: FormUpdater;
  readonly onPolicyChange: (value: string) => void;
}

export default function SpecifiedTimePanel({ form, timeZones, onUpdate, onPolicyChange }: SpecifiedTimePanelProps): ReactElement {
  return (
    <div className="casting-panel specified-time-panel">
      <CivilTimeFields
        idPrefix="specified-civil"
        includeDateTime
        localDateTime={form.specifiedDateTime}
        timezone={form.specifiedTimezone}
        fold={form.specifiedFold}
        calendarPolicyId={form.specifiedCalendarPolicyId}
        timeZones={timeZones}
        onDateTimeChange={(value) => onUpdate("specifiedDateTime", value)}
        onTimezoneChange={(value) => onUpdate("specifiedTimezone", value)}
        onFoldChange={(value) => onUpdate("specifiedFold", value)}
        onPolicyChange={onPolicyChange}
      />
    </div>
  );
}
