import type { ReactElement } from "react";
import { NAV_ITEMS, type AppView } from "./navigation-data";

interface MoreSheetProps {
  readonly open: boolean;
  readonly activeView: AppView;
  readonly onChange: (view: AppView) => void;
  readonly onClose: () => void;
}

export function MoreSheet({ open, activeView, onChange, onClose }: MoreSheetProps): ReactElement | null {
  if (!open) return null;
  return (
    <div className="more-sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="more-sheet" role="dialog" aria-modal="true" aria-label="更多页面" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <div>
            <span className="section-kicker">导航</span>
            <h2>更多页面</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭更多页面">×</button>
        </div>
        {NAV_ITEMS.slice(3).map((item) => (
          <button
            type="button"
            className={activeView === item.id ? "sheet-nav-item sheet-nav-item-active" : "sheet-nav-item"}
            onClick={() => { onChange(item.id); onClose(); }}
            key={item.id}
          >
            <span className="nav-item-glyph" aria-hidden="true">{item.shortLabel.slice(0, 1)}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
