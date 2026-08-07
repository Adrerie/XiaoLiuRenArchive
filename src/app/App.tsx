import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { runLocalDivination } from "./index";
import { ExportPanel, StructuredDetails } from "./ResultTools";
import { CALENDAR_POLICIES, listSupportedTimeZones, type CalendarPolicyId } from "../calendar";
import { PrimaryNavigation, type AppView } from "../components/navigation/PrimaryNavigation";
import { ExternalSourceLink } from "../components/knowledge/ExternalSourceLink";
import KnowledgeLibraryPage from "../pages/knowledge/KnowledgeLibraryPage";
import AboutPage from "../pages/about/AboutPage";
import MethodsPage from "../pages/methods/MethodsPage";
import ArchivePage from "../pages/archive/ArchivePage";
import { getSources, listDomains, listStageOptions, type KnowledgeDomain } from "../knowledge";
import { createArchiveStore, type ArchiveRecord, type ArchiveStore } from "../archive";
import { normalizeThreeNumberInput } from "../core/three-number";
import {
  formatTimeZoneWarning,
  INITIAL_FORM,
  selectCastingMode,
  type CastingMode,
  type FoldSelection,
  type FormState,
} from "./entry-form";
import type {
  ContentBlock,
  DivinationRequest,
  DivinationResult,
  EarthlyBranch,
} from "../shared";

const PALACE_LABELS: Readonly<Record<string, string>> = {
  da_an: "大安",
  liu_lian: "留连",
  su_xi: "速喜",
  chi_kou: "赤口",
  xiao_ji: "小吉",
  kong_wang: "空亡",
};

const BRANCHES: readonly { readonly id: EarthlyBranch; readonly label: string; readonly index: number }[] = [
  { id: "zi", label: "子时（23:00–00:59）", index: 1 },
  { id: "chou", label: "丑时（01:00–02:59）", index: 2 },
  { id: "yin", label: "寅时（03:00–04:59）", index: 3 },
  { id: "mao", label: "卯时（05:00–06:59）", index: 4 },
  { id: "chen", label: "辰时（07:00–08:59）", index: 5 },
  { id: "si", label: "巳时（09:00–10:59）", index: 6 },
  { id: "wu", label: "午时（11:00–12:59）", index: 7 },
  { id: "wei", label: "未时（13:00–14:59）", index: 8 },
  { id: "shen", label: "申时（15:00–16:59）", index: 9 },
  { id: "you", label: "酉时（17:00–18:59）", index: 10 },
  { id: "xu", label: "戌时（19:00–20:59）", index: 11 },
  { id: "hai", label: "亥时（21:00–22:59）", index: 12 },
];

const FLAG_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: "third_party_identity", label: "涉及判断第三方性取向或性别身份" },
  { id: "medical_emergency", label: "存在医疗急症或需要立即求助" },
  { id: "death", label: "涉及死亡、寿命或终末结果" },
  { id: "missing_person", label: "人员失联并且存在现实危险" },
];

function palaceLabel(id: string): string {
  return PALACE_LABELS[id] ?? id;
}

function branchLabel(id: EarthlyBranch): string {
  return BRANCHES.find((branch) => branch.id === id)?.label ?? id;
}

function readableError(error: unknown): string {
  return error instanceof Error ? error.message : "请求未能完成，请检查输入后重试。";
}

function foldValue(value: FoldSelection): 0 | 1 | null {
  if (value === "0") return 0;
  if (value === "1") return 1;
  return null;
}

function foldOption(value: string): FoldSelection {
  if (value === "0" || value === "1") return value;
  return "";
}

function policyDefinition(policyId: string) {
  return CALENDAR_POLICIES.find((policy) => policy.id === policyId);
}

function domainLabel(domainId: string): string {
  return listDomains().find((domain) => domain.id === domainId)?.name ?? domainId;
}

function sourceStatusLabel(status: string): string {
  const labels: Readonly<Record<string, string>> = {
    attested: "已见文本",
    reported: "转录记录",
    provisional: "试行来源",
    unverified: "待核验",
    rejected: "不采用",
  };
  return labels[status] ?? "来源已登记";
}

function currentTimeSummary(localDateTime: string, timeZone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u.exec(localDateTime);
  return match ? `${match[2]}月${match[3]}日 ${match[4]}:${match[5]} · ${timeZone}` : `${localDateTime} · ${timeZone}`;
}

type ThemePreference = "system" | "light" | "dark";
const THEME_STORAGE_KEY = "xiaoliurenarchive.theme.v1";

function readThemePreference(): ThemePreference {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function themeLabel(preference: ThemePreference): string {
  return preference === "system" ? "跟随系统" : preference === "light" ? "浅色模式" : "深色模式";
}

function nextThemePreference(preference: ThemePreference): ThemePreference {
  return preference === "system" ? "light" : preference === "light" ? "dark" : "system";
}

function civilPolicyOption(value: string): FormState["currentCalendarPolicyId"] {
  return value === "zi-hour-23-reuse-leap-month" ? value : "civil-midnight-reuse-leap-month";
}

function BlockSection({
  title,
  blocks,
}: {
  readonly title: string;
  readonly blocks: readonly ContentBlock[];
}): ReactElement | null {
  if (blocks.length === 0) return null;
  const statusLabel: Readonly<Record<ContentBlock["status"], string>> = {
    provisional: "试行登记",
    reviewed: "已复核",
    canonical: "校定文本",
    disputed: "存在异文",
  };
  return (
    <section className="result-section">
      <div className="section-heading">
        <span className="section-kicker">本地知识</span>
        <h3>{title}</h3>
      </div>
      <div className="content-stack">
        {blocks.map((block) => (
          <article className="content-block" key={block.id}>
            <p>{block.text}</p>
            <div className="block-meta">
              <span>{statusLabel[block.status]}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResolvedCalendar({ result }: { readonly result: DivinationResult }): ReactElement {
  if (result.calendar === null || result.input.kind !== "calendar") return <></>;
  const calendar = result.calendar;
  const lunar = calendar.resolvedLunarDate;
  const boundaryTrace = calendar.trace.find((entry) => entry.stage === "calendar-boundary");
  const lunarConversionLocalDateTime = typeof boundaryTrace?.lunarConversionLocalDateTime === "string"
    ? boundaryTrace.lunarConversionLocalDateTime
    : "manual input";
  return (
    <section className="result-section resolved-calendar">
      <div className="section-heading">
        <span className="section-kicker">历法换算</span>
        <h3>转换后的历法输入</h3>
      </div>
      <dl className="provenance-grid">
        <dt>日界调整</dt>
        <dd>{result.calendar.boundaryDecision.appliedDayOffset}</dd>
        <dt>农历换算时刻</dt>
        <dd>{lunarConversionLocalDateTime}</dd>
        <dt>输入模式</dt>
        <dd>{result.input.inputMode === "civil_datetime" ? "公历时间" : "手动农历"}</dd>
        <dt>本地日期时间</dt>
        <dd>{calendar.localDateTime ?? "手动输入"}</dd>
        <dt>时区</dt>
        <dd>{calendar.timezone ?? "不适用（手动农历）"}</dd>
        <dt>转换农历</dt>
        <dd>
          {lunar.month} 月 {lunar.day} 日{lunar.isLeapMonth ? "（闰月）" : ""}
        </dd>
        <dt>时辰</dt>
        <dd>{branchLabel(result.calendar.earthlyBranch)}</dd>
        <dt>历法策略</dt>
        <dd>
          {policyDefinition(calendar.calendarPolicyId)?.label ?? calendar.calendarPolicyId}
          {policyDefinition(calendar.calendarPolicyId)?.description ? <p className="calendar-note">{policyDefinition(calendar.calendarPolicyId)?.description}</p> : null}
        </dd>
      </dl>
      {calendar.warnings.map((warning) => (
        <p className="calendar-warning" key={warning}>{warning}</p>
      ))}
    </section>
  );
}

function TraceSection({ result }: { readonly result: DivinationResult }): ReactElement {
  const calculation = result.calculation;
  const threeNumberCalculation = calculation.algorithmId === "three-number-sequential-count-v1";
  return (
    <section className="result-section">
      <div className="section-heading">
        <span className="section-kicker">可复现路径</span>
        <h3>{threeNumberCalculation ? "三数起课推演路径" : "月、日、时推演路径"}</h3>
      </div>
      <div className="trace-grid">
        {threeNumberCalculation ? calculation.trace.map((step, index) => (
          <article className="trace-card" key={step.stage}>
            <div className="trace-number">0{index + 1}</div>
            <div>
              <strong>{step.stage === "first_number" ? "三数第一步" : step.stage === "second_number" ? "三数第二步" : "三数第三步"}</strong>
              <p>从 {palaceLabel(step.startPalaceId)} 连续起数 {step.countValue}，落在 <b>{palaceLabel(step.resultPalaceId)}</b></p>
              <code>取模余数：{step.normalizedOffset}</code>
            </div>
          </article>
        )) : calculation.trace.map((step, index) => (
          <article className="trace-card" key={step.stage}>
            <div className="trace-number">0{index + 1}</div>
            <div>
              <strong>{step.stage === "month" ? "月宫" : step.stage === "day" ? "日宫" : "时宫"}</strong>
              <p>从 {palaceLabel(step.startPalaceId)} 起数 {step.countValue} 步，落在 <b>{palaceLabel(step.resultPalaceId)}</b></p>
              <code>按六宫顺序从起点连续计数，偏移为计数减一</code>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

interface ResultPanelProps {
  readonly result: DivinationResult;
  readonly structuredDetailsOpen: boolean;
  readonly onStructuredDetailsOpenChange: (open: boolean) => void;
  readonly onSaveToArchive: () => void;
  readonly archiveStatus: string | null;
}

const CASTING_MODE_OPTIONS: readonly { readonly id: CastingMode; readonly label: string; readonly description: string }[] = [
  { id: "current_civil_time", label: "当前时间", description: "使用此设备当前日期、时间与时区" },
  { id: "specified_civil_time", label: "指定公历时间", description: "输入日期、时间与 IANA 时区" },
  { id: "manual_lunar_time", label: "手动农历", description: "直接输入农历月、日和时辰" },
  { id: "three_number_variant", label: "三数起课", description: "现代变通法：依次输入三个正整数" },
];

interface CivilTimeFieldsProps {
  readonly idPrefix: string;
  readonly includeDateTime: boolean;
  readonly localDateTime: string;
  readonly timezone: string;
  readonly fold: FoldSelection;
  readonly calendarPolicyId: Exclude<CalendarPolicyId, "manual-lunar-input-v1">;
  readonly timeZones: readonly string[];
  readonly timezoneWarning?: string | null;
  readonly onDateTimeChange: (value: string) => void;
  readonly onTimezoneChange: (value: string) => void;
  readonly onFoldChange: (value: FoldSelection) => void;
  readonly onPolicyChange: (value: string) => void;
}

function CivilTimeFields({
  idPrefix,
  includeDateTime,
  localDateTime,
  timezone,
  fold,
  calendarPolicyId,
  timeZones,
  timezoneWarning,
  onDateTimeChange,
  onTimezoneChange,
  onFoldChange,
  onPolicyChange,
}: CivilTimeFieldsProps): ReactElement {
  return (
    <>
      <div className={includeDateTime ? "form-grid three-columns" : "form-grid two-columns"}>
        {includeDateTime ? <label>本地日期时间<input id={`${idPrefix}-date-time`} type="datetime-local" step="60" value={localDateTime} onChange={(event) => onDateTimeChange(event.target.value)} /></label> : null}
        <label>IANA 时区<input id={`${idPrefix}-timezone`} list={`${idPrefix}-iana-time-zones`} type="search" placeholder="Asia/Shanghai" value={timezone} onChange={(event) => onTimezoneChange(event.target.value)} /></label>
        <label>重复时间选择<select id={`${idPrefix}-fold`} value={fold} onChange={(event) => onFoldChange(foldOption(event.target.value))}><option value="">自动（非重复时间）</option><option value="0">较早一次</option><option value="1">较晚一次</option></select></label>
      </div>
      <datalist id={`${idPrefix}-iana-time-zones`}>{timeZones.map((timeZone) => <option value={timeZone} key={timeZone} />)}</datalist>
      <label className="calendar-policy-field">历法策略
        <select id={`${idPrefix}-calendar-policy`} value={calendarPolicyId} onChange={(event) => onPolicyChange(event.target.value)}>
          {CALENDAR_POLICIES.filter((policy) => policy.id !== "manual-lunar-input-v1").map((policy) => <option value={policy.id} key={policy.id}>{policy.label}</option>)}
        </select>
      </label>
      {policyDefinition(calendarPolicyId) ? <p className="calendar-note">{policyDefinition(calendarPolicyId)?.description} {policyDefinition(calendarPolicyId)?.warning}</p> : null}
      {timezoneWarning ? <p className="calendar-warning" role="status">{timezoneWarning}</p> : null}
    </>
  );
}

function ResultPanel({ result, structuredDetailsOpen, onStructuredDetailsOpenChange, onSaveToArchive, archiveStatus }: ResultPanelProps): ReactElement {
  const messages = result.ethics.requiredNotices;
  const hardStop = result.ethics.stopPrimaryDivination;
  const sources = getSources(result.provenance.sourceIds);
  return (
    <div className="result-area" aria-live="polite">
      {messages.length > 0 || result.ethics.mode !== "allow" ? (
        <section className={`ethics-banner mode-${result.ethics.mode}`} role="alert">
          <div className="ethics-icon">!</div>
          <div className="ethics-messages">
            <span className="section-kicker">安全边界 · {result.ethics.mode === "hard_stop" ? "立即停止" : result.ethics.mode === "hard_block" ? "需要边界" : "请保留核验"}</span>
            <h2>
              {hardStop
                ? "先处理现实安全，再查看传统解释"
                : result.ethics.mode === "hard_block"
                  ? "此问题有明确的伦理边界"
                  : "请保留现实核验和当事人意愿"}
            </h2>
            {messages.map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}
            {result.ethics.requiredRealityActionCodes.length > 0 && (
              <p className="action-code">
                现实行动：{result.ethics.requiredRealityActionCodes.join(" · ")}
              </p>
            )}
          </div>
        </section>
      ) : null}
      <ResolvedCalendar result={result} />
      {!hardStop && (
        <section className="result-hero">
          <div>
            <span className="section-kicker">主结果 · {domainLabel(result.input.domainId)}</span>
            <h2 id="final-palace-result">{palaceLabel(result.calculation.finalPalaceId)}</h2>
            <p>{result.casting.kind === "three_numbers"
              ? "三数起课是现代变通法；传统报时算法、解释片段和伦理规则仍保持独立。"
              : "传统计算、历法策略和解释片段均保留在本地结构化结果中。"}</p>
          </div>
          <div className="hero-tags">
            <span className="tag">{result.casting.kind === "three_numbers"
              ? "三数起课 · 现代变通法"
              : policyDefinition(result.casting.calendarPolicyId)?.label ?? "传统报时起课"}</span>
            <span className="tag">{result.casting.kind === "three_numbers" ? "试行方法" : "传统报时起课"}</span>
          </div>
        </section>
      )}
      {!hardStop ? (
        <>
          <BlockSection title="中性象意" blocks={result.interpretation.sections.neutral} />
          <BlockSection title="当前领域解释" blocks={result.interpretation.sections.domain} />
          <BlockSection title="阶段提示" blocks={result.interpretation.sections.stage} />
          <BlockSection title="当前关系状态" blocks={result.interpretation.sections.relationshipCurrentState} />
        </>
      ) : null}
      {result.calculation.algorithmId === "three-number-sequential-count-v1" ? (
        <section className="result-section three-palace-path" aria-labelledby="three-palace-heading">
          <div className="section-heading">
            <div>
              <span className="section-kicker">三宫路径</span>
              <h3 id="three-palace-heading">第三宫为当前主判</h3>
            </div>
            <span className="policy-chip">第三宫 · 主判</span>
          </div>
          <div className="palace-path-grid">
            {result.calculation.threePalaces.map((palace) => (
              <article className={palace.ordinal === 3 ? "palace-path-card palace-path-primary" : "palace-path-card"} key={palace.ordinal}>
                <span className="path-ordinal">第{palace.ordinal}宫{palace.ordinal === 3 ? " · 主判" : ""}</span>
                <strong>{palaceLabel(palace.palaceId)}</strong>
                <span>输入 {palace.rawNumber} · 余数 {palace.normalizedOffset}</span>
              </article>
            ))}
          </div>
          <p className="helper">第一宫是起始状态，第二宫是发展过程，第三宫是当前主态；这是本地登记的现代编辑层，不代表所有流派的统一角色解释。</p>
        </section>
      ) : null}
      <TraceSection result={result} />
      <StructuredDetails
        result={result}
        open={structuredDetailsOpen}
        onOpenChange={onStructuredDetailsOpenChange}
      />
      <ExportPanel result={result} />
      <section className="result-section result-actions" aria-labelledby="archive-save-heading">
        <div className="section-heading">
          <div>
            <span className="section-kicker">本地课例册</span>
            <h3 id="archive-save-heading">只在你明确保存后记录</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onSaveToArchive}>保存到课例册</button>
        </div>
        <p className="helper">默认不保存问题原文，不上传、不云同步。保存失败会明确提示。</p>
        {archiveStatus ? <p className="export-status" role="status">{archiveStatus}</p> : null}
      </section>
      {!hardStop && (
        <>
          <BlockSection title="可执行的小步骤" blocks={result.interpretation.sections.actions} />
          <BlockSection title="现实核验" blocks={result.interpretation.sections.realityChecks} />
          <BlockSection title="传统原典（与现代解释分开）" blocks={result.interpretation.sections.traditionalText} />
          <BlockSection title="历史语境" blocks={result.interpretation.sections.historicalContext} />
          <section className="result-section provenance">
            <div className="section-heading">
              <span className="section-kicker">来源追踪</span>
              <h3>版本与来源</h3>
            </div>
            <dl className="provenance-grid">
              <dt>知识版本</dt><dd>{result.provenance.knowledgeVersion}</dd>
              <dt>规则版本</dt><dd>{result.provenance.ruleVersion}</dd>
              <dt>片段</dt><dd>{result.provenance.fragmentIds.length} 个本地片段</dd>
              <dt>伦理规则</dt><dd>{result.provenance.ethicsRuleIds.length} 条命中</dd>
            </dl>
            <div className="source-list">
              {sources.map((source) => (
                source.url ? (
                  <ExternalSourceLink className="source-card" href={source.url} key={source.id}>
                    <strong>{source.title}</strong>
                    <span>{sourceStatusLabel(source.verificationStatus)}</span>
                  </ExternalSourceLink>
                ) : (
                  <span className="source-card" key={source.id}><strong>{source.title}</strong><span>{sourceStatusLabel(source.verificationStatus)}</span></span>
                )
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function App(): ReactElement {
  const domains = useMemo<readonly KnowledgeDomain[]>(() => listDomains(), []);
  const timeZones = useMemo(() => listSupportedTimeZones(), []);
  const archiveStore = useMemo<ArchiveStore>(() => createArchiveStore(), []);
  const [view, setView] = useState<AppView>("divination");
  const [form, setForm] = useState<FormState>(() => INITIAL_FORM);
  const [archiveRecords, setArchiveRecords] = useState<readonly ArchiveRecord[]>(() => {
    try {
      return archiveStore.list();
    } catch {
      return [];
    }
  });
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(readThemePreference);
  const [busy, setBusy] = useState(false);
  const [structuredDetailsOpen, setStructuredDetailsOpen] = useState(false);
  const viewRef = useRef(view);
  const resultRef = useRef(result);
  const structuredDetailsOpenRef = useRef(structuredDetailsOpen);
  const moreOpenRef = useRef(moreOpen);
  const previousCastingModeRef = useRef(form.castingMode);
  viewRef.current = view;
  resultRef.current = result;
  structuredDetailsOpenRef.current = structuredDetailsOpen;
  moreOpenRef.current = moreOpen;
  const selectedDomain = domains.find((domain) => domain.id === form.domainId) ?? domains[0];
  const stageOptions = selectedDomain ? selectedDomain.stageOptions : [];
  const currentTimezoneWarning = formatTimeZoneWarning({
    timeZone: form.currentTimezone,
    usedFallback: form.currentTimezoneFallback,
  });
  const selectedMode = CASTING_MODE_OPTIONS.find((option) => option.id === form.castingMode) ?? CASTING_MODE_OPTIONS[0];

  useEffect(() => {
    const root = document.documentElement;
    if (themePreference === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = themePreference;
    try {
      globalThis.localStorage?.setItem(THEME_STORAGE_KEY, themePreference);
    } catch {
      // The theme remains usable for this session when storage is unavailable.
    }
  }, [themePreference]);

  useEffect(() => {
    try {
      setArchiveRecords(archiveStore.list());
      setArchiveError(null);
    } catch (archiveReadError) {
      setArchiveRecords([]);
      setArchiveError(readableError(archiveReadError));
    }
  }, [archiveStore]);

  useEffect(() => {
    if (previousCastingModeRef.current === form.castingMode) return;
    previousCastingModeRef.current = form.castingMode;
    const control = document.querySelector<HTMLElement>("#casting-input-panel input, #casting-input-panel select, #casting-input-panel button");
    control?.focus();
  }, [form.castingMode]);

  useEffect(() => {
    if (!result || typeof window === "undefined" || !window.matchMedia("(max-width: 760px)").matches) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#final-palace-result")?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [result]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let listenerHandle: PluginListenerHandle | null = null;
    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (viewRef.current !== "divination") {
        setView("divination");
        return;
      }
      if (moreOpenRef.current) {
        setMoreOpen(false);
        return;
      }
      if (structuredDetailsOpenRef.current) {
        setStructuredDetailsOpen(false);
        return;
      }
      if (resultRef.current !== null) {
        setResult(null);
        return;
      }
      void CapacitorApp.exitApp();
    });
    void listenerPromise.then((handle) => {
      if (active) listenerHandle = handle;
      else void handle.remove();
    });
    return () => {
      active = false;
      if (listenerHandle) void listenerHandle.remove();
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCurrentTimezone(value: string): void {
    setForm((current) => ({ ...current, currentTimezone: value, currentTimezoneFallback: false }));
  }

  function toggleFlag(flag: string): void {
    update("flags", form.flags.includes(flag)
      ? form.flags.filter((item) => item !== flag)
      : [...form.flags, flag]);
  }

  function changeView(nextView: AppView): void {
    setView(nextView);
    setMoreOpen(false);
  }

  function reloadArchive(): void {
    try {
      setArchiveRecords(archiveStore.list());
      setArchiveError(null);
    } catch (archiveReadError) {
      setArchiveError(readableError(archiveReadError));
    }
  }

  function saveResultToArchive(): void {
    if (!result) return;
    try {
      archiveStore.save(result);
      reloadArchive();
      setArchiveStatus("已保存到本地课例册。");
    } catch (archiveWriteError) {
      setArchiveStatus(readableError(archiveWriteError));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const questionContext = {
        domainId: form.domainId,
        stageId: form.stageId || null,
        flags: form.flags,
        facts: {
          explicitRefusalExists: form.explicitRefusalExists,
          immediateSafetyRisk: form.flags.includes("missing_person"),
        },
        privacy: { questionTextStored: false, questionTextIncludedInExport: false },
      };
      const displayPreferences = {
        language: "zh-CN" as const,
        showTraditionalText: true,
        showSourceTrace: true,
        showCalculationTrace: true,
      };
      let nextRequest: DivinationRequest;
      if (form.castingMode === "manual_lunar_time") {
        const lunarMonth = Number(form.lunarMonth);
        const lunarDay = Number(form.lunarDay);
        if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error("农历月必须是 1–12 的整数。");
        if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) throw new Error("农历日必须是 1–30 的整数。");
        nextRequest = {
          requestVersion: "1.2.0",
          casting: {
            kind: "calendar",
            inputMode: "manual_lunar",
            calendarPolicyId: "manual-lunar-input-v1",
            timeInput: { kind: "manual_lunar", lunarMonth, lunarDay, earthlyBranchIndex: form.branchIndex, isLeapMonth: form.isLeapMonth },
          },
          questionContext,
          displayPreferences,
        };
      } else if (form.castingMode === "three_number_variant") {
        if (![form.firstNumber, form.secondNumber, form.thirdNumber].every((value) => /^[0-9]*[1-9][0-9]*$/u.test(value.trim()))) {
          throw new Error("三数起课的三个数字都必须是正整数。");
        }
        const numbers = normalizeThreeNumberInput({ kind: "three_numbers", first: form.firstNumber, second: form.secondNumber, third: form.thirdNumber });
        nextRequest = {
          requestVersion: "1.2.0",
          casting: { kind: "three_numbers", input: numbers },
          questionContext,
          displayPreferences,
        };
      } else {
        const isCurrent = form.castingMode === "current_civil_time";
        const localDateTime = isCurrent ? form.currentDateTime : form.specifiedDateTime;
        const timezone = (isCurrent ? form.currentTimezone : form.specifiedTimezone).trim();
        const calendarPolicyId = isCurrent ? form.currentCalendarPolicyId : form.specifiedCalendarPolicyId;
        const fold = foldValue(isCurrent ? form.currentFold : form.specifiedFold);
        if (localDateTime.length === 0) throw new Error("请输入本地日期时间。");
        if (timezone.length === 0) throw new Error("请输入 IANA 时区，例如 Asia/Shanghai。");
        nextRequest = {
          requestVersion: "1.2.0",
          casting: {
            kind: "calendar",
            inputMode: "civil_datetime",
            calendarPolicyId,
            timeInput: { kind: "civil_datetime", localDateTime, timezone, fold },
          },
          questionContext,
          displayPreferences,
        };
      }
      setStructuredDetailsOpen(false);
      setResult(await runLocalDivination(nextRequest));
    } catch (submissionError) {
      setError(readableError(submissionError));
      setStructuredDetailsOpen(false);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">本地知识 · 测试版</span>
          <h1>小六壬档案</h1>
          <p className="lede">把输入、历法、传统计算、本地知识与现实边界放在同一条可复现路径上。</p>
        </div>
        <div className="header-actions">
          <div className="offline-badge"><span />本地运行 · 不上传问题</div>
          <button
            type="button"
            className="theme-toggle secondary-button"
            onClick={() => setThemePreference((current) => nextThemePreference(current))}
            aria-label={`切换主题，当前为${themeLabel(themePreference)}`}
          >
            {themeLabel(themePreference)}
          </button>
        </div>
      </header>

      <div className="app-layout">
        <aside className="app-sidebar">
          <PrimaryNavigation activeView={view} onChange={changeView} onMore={() => setMoreOpen((open) => !open)} />
        </aside>
        <div className="app-content">
          {moreOpen ? (
            <div className="more-menu" role="menu" aria-label="更多页面">
              <button type="button" role="menuitem" onClick={() => changeView("methods")}>方法说明</button>
              <button type="button" role="menuitem" onClick={() => changeView("about")}>关于</button>
            </div>
          ) : null}

          {view === "archive" ? <ArchivePage
            records={archiveRecords}
            error={archiveError}
            onRecordsChange={reloadArchive}
            store={archiveStore}
          /> : view === "library" ? <KnowledgeLibraryPage /> : view === "methods" ? <MethodsPage /> : view === "about" ? <AboutPage /> : <div className="divination-layout">
        <section className="input-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">01 · 起课方式</span>
              <h2>开始一课</h2>
            </div>
            <span className="policy-chip">{selectedMode.label}</span>
          </div>
          <p className="helper">{selectedMode.description}。方式切换不会清空问事领域、阶段、安全事实或其他方式的草稿。</p>
          <div className="mode-switch" role="group" aria-label="起课方式">
            {CASTING_MODE_OPTIONS.map((option) => (
              <button
                id={`casting-mode-${option.id}`}
                type="button"
                className={form.castingMode === option.id ? "mode-option mode-option-selected" : "mode-option"}
                aria-pressed={form.castingMode === option.id}
                onClick={() => setForm((current) => selectCastingMode(current, option.id))}
                key={option.id}
              >
                <span><strong>{option.label}</strong><small>{option.description}</small></span>
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <div id="casting-input-panel" key={form.castingMode} className="casting-input-panel">
              {form.castingMode === "current_civil_time" ? (
                <>
                  <div className="current-time-summary" aria-live="polite">
                    <span className="section-kicker">最近读取的当前时间</span>
                    <strong id="current-time-summary">{currentTimeSummary(form.currentDateTime, form.currentTimezone)}</strong>
                    <span>再次点击上方“当前时间”即可重新读取设备时间；普通切换、切换领域和生成结果不会覆盖它。</span>
                  </div>
                  {currentTimezoneWarning ? <p className="calendar-warning" role="status">{currentTimezoneWarning}</p> : null}
                  <details className="advanced-settings">
                    <summary>高级设置：时区、重复时间与历法策略</summary>
                    <CivilTimeFields
                      idPrefix="current-civil"
                      includeDateTime={false}
                      localDateTime={form.currentDateTime}
                      timezone={form.currentTimezone}
                      fold={form.currentFold}
                      calendarPolicyId={form.currentCalendarPolicyId}
                      timeZones={timeZones}
                      timezoneWarning={currentTimezoneWarning}
                      onDateTimeChange={(value) => update("currentDateTime", value)}
                      onTimezoneChange={updateCurrentTimezone}
                      onFoldChange={(value) => update("currentFold", value)}
                      onPolicyChange={(value) => update("currentCalendarPolicyId", civilPolicyOption(value))}
                    />
                  </details>
                </>
              ) : form.castingMode === "specified_civil_time" ? (
                  <CivilTimeFields
                    idPrefix="specified-civil"
                    includeDateTime={true}
                  localDateTime={form.specifiedDateTime}
                  timezone={form.specifiedTimezone}
                  fold={form.specifiedFold}
                  calendarPolicyId={form.specifiedCalendarPolicyId}
                  timeZones={timeZones}
                  onDateTimeChange={(value) => update("specifiedDateTime", value)}
                  onTimezoneChange={(value) => update("specifiedTimezone", value)}
                  onFoldChange={(value) => update("specifiedFold", value)}
                  onPolicyChange={(value) => update("specifiedCalendarPolicyId", civilPolicyOption(value))}
                />
              ) : form.castingMode === "manual_lunar_time" ? (
                <>
                  <div className="form-grid three-columns">
                    <label>农历月<input id="lunar-month-input" aria-label="农历月" inputMode="numeric" min="1" max="12" value={form.lunarMonth} onChange={(event) => update("lunarMonth", event.target.value)} /></label>
                    <label>农历日<input id="lunar-day-input" aria-label="农历日" inputMode="numeric" min="1" max="30" value={form.lunarDay} onChange={(event) => update("lunarDay", event.target.value)} /></label>
                    <label>十二时辰<select id="earthly-branch-select" aria-label="十二时辰" value={form.branchIndex} onChange={(event) => update("branchIndex", Number(event.target.value))}>{BRANCHES.map((branch) => <option value={branch.index} key={branch.id}>{branch.label}</option>)}</select></label>
                  </div>
                  <label className="checkbox-row"><input type="checkbox" checked={form.isLeapMonth} onChange={(event) => update("isLeapMonth", event.target.checked)} />这是闰月（沿用当前月份数字参与计算）</label>
                </>
              ) : (
                <>
                  <div className="form-grid three-columns">
                    <label>第一数<input id="three-number-first" aria-label="三数第一数" inputMode="numeric" min="1" step="1" value={form.firstNumber} onChange={(event) => update("firstNumber", event.target.value)} /></label>
                    <label>第二数<input id="three-number-second" aria-label="三数第二数" inputMode="numeric" min="1" step="1" value={form.secondNumber} onChange={(event) => update("secondNumber", event.target.value)} /></label>
                    <label>第三数<input id="three-number-third" aria-label="三数第三数" inputMode="numeric" min="1" step="1" value={form.thirdNumber} onChange={(event) => update("thirdNumber", event.target.value)} /></label>
                  </div>
                  <p className="method-note"><strong>现代变通法</strong>：在查看结果前，依次确定三个正整数，可以使用当下首先想到或现实中自然出现的数字。数字一经确定再提交，不因结果不满意反复更换。系统不自动随机生成数字，也不声称“越随机越准”；三个数字按大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡连续起数，大数会按六宫循环精确处理。它不等同于传统报时起课法，也不把三个数字当作农历月、日、时辰。</p>
                </>
              )}
            </div>
            <div className="form-divider" />
            <div className="form-grid two-columns">
              <label>问事领域<select value={form.domainId} onChange={(event) => { const domainId = event.target.value; const nextStages = listStageOptions(domainId); setForm((current) => ({ ...current, domainId, stageId: nextStages[0]?.id ?? "" })); }}>{domains.map((domain) => <option value={domain.id} key={domain.id}>{domain.name}</option>)}</select></label>
              <label>当前阶段（可选）<select value={form.stageId} onChange={(event) => update("stageId", event.target.value)}><option value="">不指定阶段</option>{stageOptions.map((stage) => <option value={stage.id} key={stage.id}>{stage.label}</option>)}</select></label>
            </div>
            <fieldset>
              <legend>现实事实与安全确认</legend>
              <label className="checkbox-row"><input type="checkbox" checked={form.explicitRefusalExists} onChange={(event) => update("explicitRefusalExists", event.target.checked)} />对方已经明确拒绝、撤回或设置边界</label>
              <div className="flag-list">{FLAG_OPTIONS.map((flag) => <label className="checkbox-row" key={flag.id}><input type="checkbox" checked={form.flags.includes(flag.id)} onChange={() => toggleFlag(flag.id)} />{flag.label}</label>)}</div>
            </fieldset>
            <p className="privacy-note">隐私：此界面不要求问题原文；本地结果默认不保存问题文本，也不会调用远程服务。</p>
            {error && <div className="error-box" role="alert">{error}</div>}
            <button id="generate-result-button" className="primary-button" type="submit" disabled={busy}>{busy ? "正在本地计算…" : "生成可复现结果"}</button>
          </form>
        </section>

        {result ? <ResultPanel
          result={result}
          structuredDetailsOpen={structuredDetailsOpen}
          onStructuredDetailsOpenChange={setStructuredDetailsOpen}
          onSaveToArchive={saveResultToArchive}
          archiveStatus={archiveStatus}
        /> : <section className="empty-state"><span className="section-kicker">02 · 结果</span><h2>结果会在这里展开</h2><p>提交后可查看主结果、对应路径、本地解释、原典来源和安全边界。</p></section>}
      </div>}
          <footer className="app-footer">传统计算为固定规则的文化解释，不构成医疗、法律或财务意见。</footer>
        </div>
      </div>
    </main>
  );
}
