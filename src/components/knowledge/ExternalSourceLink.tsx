import { useState, type MouseEvent, type ReactNode, type ReactElement } from "react";
import { Capacitor } from "@capacitor/core";
import { openExternalLink } from "../../platform/open-external-link";

interface ExternalSourceLinkProps {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function ExternalSourceLink({ href, className, children }: ExternalSourceLinkProps): ReactElement {
  const [status, setStatus] = useState<string | null>(null);
  const native = Capacitor.isNativePlatform();

  async function handleClick(event: MouseEvent<HTMLAnchorElement>): Promise<void> {
    if (!native) return;
    event.preventDefault();
    try {
      await openExternalLink(href);
      setStatus("已交由系统浏览器打开。");
    } catch {
      setStatus("外部来源无法打开，请稍后重试。");
    }
  }

  return (
    <>
      <a
        href={href}
        className={className}
        target={native ? undefined : "_blank"}
        rel={native ? undefined : "noreferrer noopener"}
        onClick={(event) => void handleClick(event)}
      >
        {children}
      </a>
      {status ? <span className="external-link-status" role="status">{status}</span> : null}
    </>
  );
}
