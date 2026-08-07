import type { ReactElement } from "react";

export type AppView = "divination" | "archive" | "library" | "methods" | "about";

interface PrimaryNavigationProps {
  readonly activeView: AppView;
  readonly onChange: (view: AppView) => void;
  readonly onMore: () => void;
}

const ITEMS: readonly { readonly id: AppView; readonly label: string }[] = [
  { id: "divination", label: "起课" },
  { id: "archive", label: "课例册" },
  { id: "library", label: "六宫资料" },
  { id: "methods", label: "方法说明" },
  { id: "about", label: "关于" },
];

export function PrimaryNavigation({ activeView, onChange, onMore }: PrimaryNavigationProps): ReactElement {
  return (
    <>
      <nav className="primary-navigation" aria-label="主导航">
        {ITEMS.map((item) => (
          <button
            id={`nav-${item.id}`}
            type="button"
            className={activeView === item.id ? "nav-item nav-item-active" : "nav-item"}
            aria-current={activeView === item.id ? "page" : undefined}
            aria-label={item.label}
            onClick={() => onChange(item.id)}
            key={item.id}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <nav className="mobile-bottom-navigation" aria-label="移动端主导航">
        {ITEMS.slice(0, 3).map((item) => (
          <button
            id={`mobile-nav-${item.id}`}
            type="button"
            className={activeView === item.id ? "nav-item nav-item-active" : "nav-item"}
            aria-current={activeView === item.id ? "page" : undefined}
            aria-label={item.label}
            onClick={() => onChange(item.id)}
            key={item.id}
          >
            {item.label}
          </button>
        ))}
        <button
          id="mobile-nav-more"
          type="button"
          className={activeView === "methods" || activeView === "about" ? "nav-item nav-item-active" : "nav-item"}
          aria-label="更多"
          aria-haspopup="menu"
          onClick={onMore}
        >
          更多
        </button>
      </nav>
    </>
  );
}
