import type { ReactElement } from "react";

export type AppView = "divination" | "library" | "about";

interface PrimaryNavigationProps {
  readonly activeView: AppView;
  readonly onChange: (view: AppView) => void;
}

const ITEMS: readonly { readonly id: AppView; readonly label: string }[] = [
  { id: "divination", label: "起课" },
  { id: "library", label: "资料库" },
  { id: "about", label: "说明" },
];

export function PrimaryNavigation({ activeView, onChange }: PrimaryNavigationProps): ReactElement {
  return (
    <nav className="primary-navigation" aria-label="主导航">
      {ITEMS.map((item) => (
        <button
          type="button"
          className={activeView === item.id ? "nav-item nav-item-active" : "nav-item"}
          aria-current={activeView === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
          key={item.id}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
