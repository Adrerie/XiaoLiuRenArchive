import { useMemo, useState, type ReactElement } from "react";
import type { PalaceId } from "../../shared";
import {
  getSources,
  listDomains,
  listPalaces,
  searchPalaces,
} from "../../knowledge";
import { PalaceCard } from "../../components/knowledge/PalaceCard";
import { PalaceDetail } from "../../components/knowledge/PalaceDetail";

export default function KnowledgeLibraryPage(): ReactElement {
  const allPalaces = useMemo(() => listPalaces(), []);
  const domains = useMemo(() => listDomains(), []);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<PalaceId>("da_an");
  const palaces = useMemo(() => searchPalaces(query), [query]);
  const selectedPalace = palaces.find((palace) => palace.id === selectedId) ?? palaces[0] ?? allPalaces[0];
  const sourceIds = selectedPalace
    ? [...new Set([
        ...selectedPalace.sourceIds,
        ...selectedPalace.neutralSourceIds,
        ...selectedPalace.modernSourceIds,
        ...selectedPalace.traditionalSourceIds,
        ...selectedPalace.statePhraseSourceIds,
        ...selectedPalace.elementSourceIds,
        ...selectedPalace.elementVariants.flatMap((variant) => variant.sourceIds),
        ...selectedPalace.statePhraseVariants.flatMap((variant) => variant.sourceIds),
        ...selectedPalace.spiritSourceIds,
        ...selectedPalace.spiritVariants.flatMap((variant) => variant.sourceIds),
      ])]
    : [];
  const sources = useMemo(() => getSources(sourceIds), [sourceIds.join("|")]);

  return (
    <section className="library-page">
      <header className="page-intro">
        <span className="section-kicker">本地知识库</span>
        <h2>六宫资料库</h2>
        <p>固定传统顺序浏览六宫；搜索只读取本地登记的宫名、原典、现代释义和领域解释。</p>
      </header>
      <label className="library-search">本地搜索
        <input id="library-search-input" aria-label="资料库搜索" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索宫名、五行、原典或解释关键词" />
      </label>
      <p id="library-result-count" role="status" aria-live="polite">找到 {palaces.length} 条本地资料</p>
      <div className="library-layout">
        <div className="palace-list" aria-label="六宫列表">
          {palaces.map((palace) => <PalaceCard palace={palace} selected={palace.id === selectedPalace?.id} onSelect={() => setSelectedId(palace.id)} key={palace.id} />)}
          {palaces.length === 0 ? <p className="empty-state">没有匹配的本地资料。</p> : null}
        </div>
        {selectedPalace ? <PalaceDetail palace={selectedPalace} domains={domains} sources={sources} /> : null}
      </div>
    </section>
  );
}
