import type { ReactElement } from "react";
import type { PalaceKnowledge } from "../../knowledge";

function statusLabel(status: string): string {
  if (status === "disputed") return "disputed · 有异文";
  if (status === "reviewed") return "reviewed";
  if (status === "canonical") return "canonical";
  return "provisional";
}

interface PalaceCardProps {
  readonly palace: PalaceKnowledge;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

export function PalaceCard({ palace, selected, onSelect }: PalaceCardProps): ReactElement {
  return (
    <button
      id={`palace-card-${palace.id}`}
      data-palace-id={palace.id}
      type="button"
      className={selected ? "palace-card palace-card-selected" : "palace-card"}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="palace-card-heading">
        <strong>{palace.name}</strong>
        <span className="status-pill">{palace.disputedFieldIds.length > 0 ? "有异文" : statusLabel(palace.elementStatus)}</span>
      </span>
      <span className="palace-card-meta">五行 {palace.element} · 六神 {palace.spirit}</span>
      <span className="palace-card-summary">{palace.neutralSummary}</span>
    </button>
  );
}
