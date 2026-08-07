import type { ReactElement } from "react";
import type { CastingMode } from "../../app/entry-form";
import type { CastingModeOption } from "./casting-types";

interface CastingMethodSelectorProps {
  readonly value: CastingMode;
  readonly options: readonly CastingModeOption[];
  readonly onChange: (mode: CastingMode) => void;
}

export default function CastingMethodSelector({ value, options, onChange }: CastingMethodSelectorProps): ReactElement {
  return (
    <div className="method-selector" role="group" aria-label="起课方式">
      {options.map((option) => (
        <button
          id={`casting-mode-${option.id}`}
          type="button"
          className={value === option.id ? "method-option method-option-selected" : "method-option"}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          key={option.id}
        >
          <span className="method-option-mark" aria-hidden="true">{value === option.id ? "✓" : "○"}</span>
          <span>
            <strong>{option.label}</strong>
            <small>{option.description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
