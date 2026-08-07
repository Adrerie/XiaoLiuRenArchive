import { useEffect, useRef, type ReactElement } from "react";
import { NAV_ITEMS, type AppView } from "./navigation-data";
import { ThemePreferenceControl } from "./ThemePreferenceControl";
import type { ThemePreference } from "../../platform/theme";

interface MoreSheetProps {
  readonly open: boolean;
  readonly activeView: AppView;
  readonly themePreference: ThemePreference;
  readonly onChange: (view: AppView) => void;
  readonly onClose: () => void;
  readonly onThemePreferenceChange: (preference: ThemePreference) => void;
}

export function MoreSheet({ open, activeView, themePreference, onChange, onClose, onThemePreferenceChange }: MoreSheetProps): ReactElement | null {
  const sheetRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      const restoreTarget = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restoreTarget) window.requestAnimationFrame(() => restoreTarget.focus());
      return;
    }

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusSheet = (): void => closeButtonRef.current?.focus();
    focusSheet();
    const animationFrame = window.requestAnimationFrame(focusSheet);
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="more-sheet-backdrop" role="presentation" onClick={onClose}>
      <section ref={sheetRef} className="more-sheet" role="dialog" aria-modal="true" aria-labelledby="more-sheet-heading" tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <div>
            <span className="section-kicker">导航</span>
            <h2 id="more-sheet-heading">更多页面</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="关闭更多页面">×</button>
        </div>
        <div className="sheet-appearance">
          <span className="section-kicker">外观</span>
          <ThemePreferenceControl preference={themePreference} onChange={onThemePreferenceChange} />
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
