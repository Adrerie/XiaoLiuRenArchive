import type { ReactElement } from "react";
import type { AppView } from "./navigation-data";

interface MobileTopBarProps {
  readonly activeView: AppView;
  readonly themeLabel: string;
  readonly onThemeToggle: () => void;
}

const VIEW_LABELS: Readonly<Record<AppView, string>> = {
  divination: "开始一课",
  archive: "本地案例库",
  library: "六宫资料",
  methods: "方法说明",
  about: "关于档案",
};

export function MobileTopBar({ activeView, themeLabel, onThemeToggle }: MobileTopBarProps): ReactElement {
  return (
    <header className="mobile-topbar">
      <div className="mobile-brand">
        <span className="brand-mark" aria-hidden="true">六</span>
        <div>
          <span className="eyebrow">小六壬档案</span>
          <strong>{VIEW_LABELS[activeView]}</strong>
        </div>
      </div>
      <button type="button" className="theme-toggle secondary-button" onClick={onThemeToggle} aria-label="切换日夜主题">
        {themeLabel}
      </button>
    </header>
  );
}
