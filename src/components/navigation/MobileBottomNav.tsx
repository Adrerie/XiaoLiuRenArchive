import type { ReactElement } from "react";
import { NAV_ITEMS, type AppView } from "./navigation-data";

interface MobileBottomNavProps {
  readonly activeView: AppView;
  readonly onChange: (view: AppView) => void;
  readonly onMore: () => void;
  readonly moreOpen: boolean;
}

export function MobileBottomNav({ activeView, onChange, onMore, moreOpen }: MobileBottomNavProps): ReactElement {
  return (
    <nav className="mobile-bottom-navigation" aria-label="移动端主导航">
      {NAV_ITEMS.slice(0, 3).map((item) => (
        <button
          id={`mobile-nav-${item.id}`}
          type="button"
          className={activeView === item.id ? "nav-item nav-item-active" : "nav-item"}
          aria-current={activeView === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
          key={item.id}
        >
          <span className="nav-item-glyph" aria-hidden="true">{item.shortLabel.slice(0, 1)}</span>
          <span>{item.shortLabel}</span>
        </button>
      ))}
      <button
        id="mobile-nav-more"
        type="button"
        className={moreOpen || activeView === "methods" || activeView === "about" ? "nav-item nav-item-active" : "nav-item"}
        aria-label="更多"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        onClick={onMore}
      >
        <span className="nav-item-glyph" aria-hidden="true">⋯</span>
        <span>更多</span>
      </button>
    </nav>
  );
}
