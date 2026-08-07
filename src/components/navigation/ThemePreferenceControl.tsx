import type { ReactElement } from "react";
import type { ThemePreference } from "../../platform/theme";

const THEME_OPTIONS: readonly { readonly value: ThemePreference; readonly label: string }[] = [
  { value: "system", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
];

interface ThemePreferenceControlProps {
  readonly preference: ThemePreference;
  readonly onChange: (preference: ThemePreference) => void;
}

export function ThemePreferenceControl({ preference, onChange }: ThemePreferenceControlProps): ReactElement {
  return (
    <div className="theme-preference-control" role="group" aria-label="外观主题">
      {THEME_OPTIONS.map((option) => (
        <button
          type="button"
          className="theme-preference-option"
          aria-pressed={preference === option.value}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
