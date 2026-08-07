import type { ReactNode, ReactElement } from "react";
import { DesktopSidebar } from "../components/navigation/DesktopSidebar";
import { MobileBottomNav } from "../components/navigation/MobileBottomNav";
import { MobileTopBar } from "../components/navigation/MobileTopBar";
import { MoreSheet } from "../components/navigation/MoreSheet";
import type { AppView } from "../components/navigation/navigation-data";

interface AppShellProps {
  readonly activeView: AppView;
  readonly moreOpen: boolean;
  readonly themeLabel: string;
  readonly children: ReactNode;
  readonly onChangeView: (view: AppView) => void;
  readonly onMoreToggle: () => void;
  readonly onMoreClose: () => void;
  readonly onThemeToggle: () => void;
}

export default function AppShell({
  activeView,
  moreOpen,
  themeLabel,
  children,
  onChangeView,
  onMoreToggle,
  onMoreClose,
  onThemeToggle,
}: AppShellProps): ReactElement {
  return (
    <main className="app-shell">
      <MobileTopBar activeView={activeView} themeLabel={themeLabel} onThemeToggle={onThemeToggle} />
      <div className="app-layout">
        <DesktopSidebar activeView={activeView} onChange={onChangeView} />
        <div className="app-content">
          <header className="desktop-header">
            <div>
              <span className="eyebrow">本地知识 · 测试版</span>
              <h1>小六壬档案</h1>
              <p className="lede">把输入、历法、传统计算、本地知识与现实边界放在同一条可复现路径上。</p>
            </div>
            <div className="header-actions">
              <div className="offline-badge"><span />本地运行 · 不上传问题</div>
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
      <MoreSheet open={moreOpen} activeView={activeView} onChange={onChangeView} onClose={onMoreClose} />
    </main>
  );
}

export type { AppView } from "../components/navigation/navigation-data";
