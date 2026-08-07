import type { ReactNode, ReactElement } from "react";

interface TechnicalDisclosureProps {
  readonly open: boolean;
  readonly hardStop: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children: ReactNode;
}

export default function TechnicalDisclosure({ open, hardStop, onOpenChange, children }: TechnicalDisclosureProps): ReactElement {
  return (
    <section className="technical-disclosure-section result-section">
      <details id="technical-disclosure" open={open} onToggle={(event) => onOpenChange(event.currentTarget.open)}>
        <summary>{hardStop ? "传统计算与技术记录（不作为当前现实行动依据）" : "查看计算路径、来源与导出工具"}</summary>
        <div className="technical-disclosure-content">{children}</div>
      </details>
    </section>
  );
}
