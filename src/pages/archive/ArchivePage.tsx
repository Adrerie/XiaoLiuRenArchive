import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from "react";
import type { ArchiveRecord, ArchiveStore } from "../../archive";
import { listDomains } from "../../knowledge";

interface ArchivePageProps {
  readonly records: readonly ArchiveRecord[];
  readonly error: string | null;
  readonly onRecordsChange: () => void;
  readonly store: ArchiveStore;
}

const PALACE_LABELS: Readonly<Record<string, string>> = {
  da_an: "大安",
  liu_lian: "留连",
  su_xi: "速喜",
  chi_kou: "赤口",
  xiao_ji: "小吉",
  kong_wang: "空亡",
};

function palaceLabel(id: string): string {
  return PALACE_LABELS[id] ?? id;
}

function domainLabel(id: string): string {
  return listDomains().find((domain) => domain.id === id)?.name ?? id;
}

function downloadJson(json: string): void {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `xiaoliurenarchive-cases-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ArchivePage({ records, error, onRecordsChange, store }: ArchivePageProps): ReactElement {
  const storageUnavailable = !store.capability.available;
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [titleDraft, setTitleDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? records[0] ?? null,
    [records, selectedId],
  );

  useEffect(() => {
    setSelectedId((current) => records.some((record) => record.id === current) ? current : records[0]?.id ?? null);
  }, [records]);

  useEffect(() => {
    setTitleDraft(selectedRecord?.title ?? "");
  }, [selectedRecord]);

  function showStatus(message: string): void {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 3200);
  }

  function updateTitle(): void {
    if (!selectedRecord) return;
    try {
      store.updateTitle(selectedRecord.id, titleDraft);
      onRecordsChange();
      showStatus("标题已更新。");
    } catch (writeError) {
      showStatus(writeError instanceof Error ? writeError.message : "标题保存失败。");
    }
  }

  function removeSelected(): void {
    if (!selectedRecord || !window.confirm("确定删除这条本地课例吗？删除后无法从课例册恢复。")) return;
    try {
      store.remove(selectedRecord.id);
      onRecordsChange();
      showStatus("课例已删除。");
    } catch (writeError) {
      showStatus(writeError instanceof Error ? writeError.message : "删除失败。");
    }
  }

  function clearAll(): void {
    if (records.length === 0 || !window.confirm("确定清空全部本地课例吗？此操作无法撤销。")) return;
    try {
      store.clear();
      onRecordsChange();
      showStatus("课例册已清空。");
    } catch (writeError) {
      showStatus(writeError instanceof Error ? writeError.message : "清空失败。");
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const report = store.importJson(parsed);
      onRecordsChange();
      showStatus(`已导入 ${report.importedCount} 条课例${report.migratedCount > 0 ? `，迁移旧版 ${report.migratedCount} 条` : ""}。`);
    } catch (importError) {
      showStatus(importError instanceof Error ? importError.message : "导入失败，文件未被写入课例册。");
    }
  }

  return (
    <section className="archive-page">
      <header className="page-intro">
        <span className="section-kicker">本地课例册</span>
        <h2>课例册</h2>
        <p>只有明确点击保存的结果才会进入本地课例册；不保存问题原文，不上传，也不建立账号。</p>
      </header>
      <div className="archive-toolbar">
        <button type="button" className="secondary-button" onClick={() => downloadJson(store.exportJson())}>导出全部课例</button>
        <button type="button" className="secondary-button" disabled={storageUnavailable} onClick={() => fileInputRef.current?.click()}>导入课例 JSON</button>
        <button type="button" className="secondary-button danger-button" disabled={storageUnavailable} onClick={clearAll}>清空全部</button>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importFile(event)} />
      </div>
      {storageUnavailable ? <p className="storage-warning" role="status">{store.capability.message}</p> : null}
      {error ? <p className="error-box" role="alert">{error}</p> : null}
      {status ? <p className="export-status" role="status">{status}</p> : null}
      <div className="archive-layout">
        <div className="archive-list" aria-label="本地课例列表">
          <p className="helper">共 {records.length} 条课例</p>
          {records.map((record) => (
            <button
              type="button"
              className={record.id === selectedRecord?.id ? "archive-card archive-card-selected" : "archive-card"}
              onClick={() => setSelectedId(record.id)}
              key={record.id}
            >
              <strong>{record.title ?? "未命名课例"}</strong>
              <span>{record.methodName} · {palaceLabel(record.primaryPalaceId)}</span>
              <small>{new Date(record.createdAt).toLocaleString("zh-CN")}</small>
            </button>
          ))}
          {records.length === 0 ? <div className="empty-state"><p>还没有保存的课例。生成结果后，点击“保存到课例册”。</p></div> : null}
        </div>
        {selectedRecord ? (
          <article className="archive-detail result-section" aria-labelledby="archive-detail-heading">
            <div className="section-heading">
              <div>
                <span className="section-kicker">课例详情</span>
                <h3 id="archive-detail-heading">{selectedRecord.title ?? "未命名课例"}</h3>
              </div>
              <span className="policy-chip">{palaceLabel(selectedRecord.primaryPalaceId)}{selectedRecord.primaryPalaceOrdinal === 3 ? " · 主判" : ""}</span>
            </div>
            <div className="archive-title-editor">
              <label>本地标题<input value={titleDraft} maxLength={120} onChange={(event) => setTitleDraft(event.target.value)} placeholder="可选" /></label>
              <button type="button" className="secondary-button" disabled={storageUnavailable} onClick={updateTitle}>保存标题</button>
              <button type="button" className="secondary-button danger-button" disabled={storageUnavailable} onClick={removeSelected}>删除这条</button>
            </div>
            <dl className="provenance-grid">
              <dt>起课方法</dt><dd>{selectedRecord.methodName}</dd>
              <dt>问事领域</dt><dd>{domainLabel(selectedRecord.domainId)}</dd>
              <dt>当前阶段</dt><dd>{selectedRecord.stageLabel ?? "不指定阶段"}</dd>
              <dt>保存时间</dt><dd>{new Date(selectedRecord.createdAt).toLocaleString("zh-CN")}</dd>
              {selectedRecord.path.kind === "three_palaces" ? (
                <>
                  <dt>三宫路径</dt><dd>{selectedRecord.path.palaces.map((palace) => palaceLabel(palace.palaceId)).join(" → ")} · 第三宫主判</dd>
                </>
              ) : (
                <>
                  <dt>传统路径</dt><dd>{[selectedRecord.path.monthPalaceId, selectedRecord.path.dayPalaceId, selectedRecord.path.hourPalaceId].map(palaceLabel).join(" → ")} · 时宫主判</dd>
                </>
              )}
              {selectedRecord.migratedFrom ? <><dt>迁移标记</dt><dd>旧版 {selectedRecord.migratedFrom} 结果</dd></> : null}
            </dl>
            <details className="technical-details">
              <summary>查看完整结构化结果</summary>
              <pre className="archive-json">{JSON.stringify(selectedRecord.result, null, 2)}</pre>
            </details>
          </article>
        ) : null}
      </div>
    </section>
  );
}
