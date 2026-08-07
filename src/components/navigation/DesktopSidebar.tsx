import type { ReactElement } from "react";
import { NAV_ITEMS, type AppView } from "./navigation-data";

interface DesktopSidebarProps {
  readonly activeView: AppView;
  readonly onChange: (view: AppView) => void;
}

export function DesktopSidebar({ activeView, onChange }: DesktopSidebarProps): ReactElement {
  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">六</span>
        <div>
          <strong>小六壬档案</strong>
          <span>本地知识 · 可复现</span>
        </div>
      </div>
      <nav className="desktop-nav" aria-label="主导航">
        {NAV_ITEMS.map((item) => (
          <button
            id={`nav-${item.id}`}
            type="button"
            className={activeView === item.id ? "nav-item nav-item-active" : "nav-item"}
            aria-current={activeView === item.id ? "page" : undefined}
            onClick={() => onChange(item.id)}
            key={item.id}
          >
            <span className="nav-item-glyph" aria-hidden="true">{item.shortLabel.slice(0, 1)}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <p className="sidebar-note">计算、知识与现实边界均在设备本地处理。</p>
    </aside>
  );
}

export type { AppView } from "./navigation-data";
