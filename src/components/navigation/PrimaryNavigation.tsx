import type { ReactElement } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import type { AppView } from "./navigation-data";

interface PrimaryNavigationProps {
  readonly activeView: AppView;
  readonly onChange: (view: AppView) => void;
  readonly onMore: () => void;
  readonly moreOpen?: boolean;
}

/** Backwards-compatible facade for pages that still import the old symbol. */
export function PrimaryNavigation({ activeView, onChange, onMore, moreOpen = false }: PrimaryNavigationProps): ReactElement {
  return (
    <>
      <DesktopSidebar activeView={activeView} onChange={onChange} />
      <MobileBottomNav activeView={activeView} onChange={onChange} onMore={onMore} moreOpen={moreOpen} />
    </>
  );
}

export type { AppView } from "./navigation-data";
