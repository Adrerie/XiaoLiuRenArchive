import type { ReactNode, ReactElement } from "react";
import { DesktopSidebar } from "../components/navigation/DesktopSidebar";
import { MobileBottomNav } from "../components/navigation/MobileBottomNav";
import { MobileTopBar } from "../components/navigation/MobileTopBar";
import { MoreSheet } from "../components/navigation/MoreSheet";
import { ThemePreferenceControl } from "../components/navigation/ThemePreferenceControl";
import type { AppView } from "../components/navigation/navigation-data";
import type { ThemePreference } from "../platform/theme";

const PAGE_TITLES: Readonly<Record<AppView, string>> = {
  divination: "起课",
  archive: "课例册",
  library: "六宫资料",
  methods: "方法说明",
  about: "关于档案",
};

interface AppShellProps {
  readonly activeView: AppView;
  readonly hasResult: boolean;
  readonly moreOpen: boolean;
  readonly themeLabel: string;
  readonly themePreference: ThemePreference;
  readonly children: ReactNode;
  readonly onChangeView: (view: AppView) => void;
  readonly onMoreToggle: () => void;
  readonly onMoreClose: () => void;
  readonly onThemeToggle: () => void;
  readonly onThemePreferenceChange: (preference: ThemePreference) => void;
}

export default function AppShell({
  activeView,
  hasResult,
  moreOpen,
  themeLabel,
  themePreference,
  children,
  onChangeView,
  onMoreToggle,
  onMoreClose,
  onThemeToggle,
  onThemePreferenceChange,
}: AppShellProps): ReactElement {
  return (
    <main className="app-shell" data-has-result={hasResult ? "true" : "false"}>
      <MobileTopBar activeView={activeView} themeLabel={themeLabel} onThemeToggle={onThemeToggle} />
      <div className="app-layout">
        <DesktopSidebar activeView={activeView} onChange={onChangeView} />
        <div className="app-content">
          <header className="desktop-header">
            <div>
              <span className="eyebrow">本地运行 · 不上传问题</span>
              <h1>{PAGE_TITLES[activeView]}</h1>
            </div>
            <div className="header-actions">
              <div className="offline-badge"><span />离线运行</div>
              <details className="desktop-theme-menu">
                <summary className="secondary-button">外观</summary>
                <ThemePreferenceControl preference={themePreference} onChange={onThemePreferenceChange} />
              </details>
              <button type="button" className="theme-toggle secondary-button" onClick={onThemeToggle} aria-label="切换日夜主题">
                {themeLabel}
              </button>
            </div>
          </header>
          {children}
          <footer className="app-footer">传统计算是固定规则的文化解释，不构成医疗、法律或财务意见。</footer>
        </div>
      </div>
      <MobileBottomNav activeView={activeView} onChange={onChangeView} onMore={onMoreToggle} moreOpen={moreOpen} />
      <MoreSheet open={moreOpen} activeView={activeView} themePreference={themePreference} onChange={onChangeView} onClose={onMoreClose} onThemePreferenceChange={onThemePreferenceChange} />
    </main>
  );
}

export type { AppView } from "../components/navigation/navigation-data";
