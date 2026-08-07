import type { ReactElement } from "react";
import type { ContentBlock, DivinationResult } from "../../shared";

export const PALACE_LABELS: Readonly<Record<string, string>> = {
  da_an: "大安",
  liu_lian: "留连",
  su_xi: "速喜",
  chi_kou: "赤口",
  xiao_ji: "小吉",
  kong_wang: "空亡",
};

export function palaceLabel(id: string): string {
  return PALACE_LABELS[id] ?? id;
}

const STATUS_LABELS: Readonly<Record<ContentBlock["status"], string>> = {
  provisional: "试行登记",
  reviewed: "已复核",
  canonical: "校定文本",
  disputed: "存在异文",
};

export function BlockSection({ title, blocks }: { readonly title: string; readonly blocks: readonly ContentBlock[] }): ReactElement | null {
  if (blocks.length === 0) return null;
  return (
    <section className="result-section content-section">
      <div className="section-heading">
        <span className="section-kicker">本地知识</span>
        <h3>{title}</h3>
      </div>
      <div className="content-stack">
        {blocks.map((block) => (
          <article className="content-block" key={block.id}>
            <p>{block.text}</p>
            <div className="block-meta"><span>{STATUS_LABELS[block.status]}</span></div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function resultDomainLabel(result: DivinationResult, domains: readonly { readonly id: string; readonly name: string }[]): string {
  return domains.find((domain) => domain.id === result.interpretation.domainId)?.name ?? result.interpretation.domainId;
}
