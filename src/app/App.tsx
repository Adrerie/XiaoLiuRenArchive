import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { runLocalDivination } from "./index";
import AppShell from "./AppShell";
import CastingPage from "../pages/casting/CastingPage";
import ResultView from "../pages/result/ResultView";
import KnowledgeLibraryPage from "../pages/knowledge/KnowledgeLibraryPage";
import AboutPage from "../pages/about/AboutPage";
import MethodsPage from "../pages/methods/MethodsPage";
import ArchivePage from "../pages/archive/ArchivePage";
import { CALENDAR_POLICIES, listSupportedTimeZones } from "../calendar";
import { createArchiveStore, type ArchiveRecord, type ArchiveStore } from "../archive";
import { listDomains, listStageOptions, type KnowledgeDomain } from "../knowledge";
import { normalizeThreeNumberInput } from "../core/three-number";
import {
  formatTimeZoneWarning,
  INITIAL_FORM,
  refreshCurrentTime,
  selectCastingMode,
  type CastingMode,
  type FormState,
} from "./entry-form";
import { syncNativeTheme, type ThemePreference } from "../platform/theme";
import type { DivinationRequest, DivinationResult } from "../shared";
import type { AppView } from "../components/navigation/navigation-data";
import type { CastingModeOption, FormUpdater } from "../pages/casting/casting-types";

const CASTING_MODE_OPTIONS: readonly CastingModeOption[] = [
  { id: "current_civil_time", label: "当前时间", description: "读取设备当前日期、时间与时区" },
  { id: "specified_civil_time", label: "指定公历时间", description: "输入日期、时间与 IANA 时区" },
  { id: "manual_lunar_time", label: "手动农历", description: "直接输入农历月、日和时辰" },
  { id: "three_number_variant", label: "三数起课", description: "现代变通法：依次输入三个正整数" },
];

const FLAG_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: "third_party_identity", label: "涉及判断第三方取向或性别身份" },
  { id: "medical_emergency", label: "存在医疗急症或需要立即求助" },
  { id: "death", label: "涉及死亡、寿命或终末结果" },
  { id: "missing_person", label: "人员失联并且存在现实危险" },
];

const THEME_STORAGE_KEY = "xiaoliurenarchive.theme.v1";
type ResolvedTheme = Exclude<ThemePreference, "system">;

function readableError(error: unknown): string {
  return error instanceof Error ? error.message : "请求未能完成，请检查输入后重试。";
}

function readThemePreference(): ThemePreference {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function detectSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function themeLabel(preference: ThemePreference, systemTheme: ResolvedTheme): string {
  return (preference === "system" ? systemTheme : preference) === "dark" ? "☾" : "☀";
}

function nextThemePreference(preference: ThemePreference, systemTheme: ResolvedTheme): ThemePreference {
  const activeTheme = preference === "system" ? systemTheme : preference;
  return activeTheme === "dark" ? "light" : "dark";
}

function foldValue(value: FormState["currentFold"]): 0 | 1 | null {
  if (value === "0") return 0;
  if (value === "1") return 1;
  return null;
}

function civilPolicyOption(value: string): FormState["currentCalendarPolicyId"] {
  return value === "zi-hour-23-reuse-leap-month" ? value : "civil-midnight-reuse-leap-month";
}

function buildRequest(form: FormState): DivinationRequest {
  const questionContext = {
    domainId: form.domainId,
    stageId: form.stageId || null,
    flags: form.flags,
    facts: { explicitRefusalExists: form.explicitRefusalExists, immediateSafetyRisk: form.flags.includes("missing_person") },
    privacy: { questionTextStored: false, questionTextIncludedInExport: false },
  };
  const displayPreferences = { language: "zh-CN" as const, showTraditionalText: true, showSourceTrace: true, showCalculationTrace: true };
  if (form.castingMode === "manual_lunar_time") {
    const lunarMonth = Number(form.lunarMonth);
    const lunarDay = Number(form.lunarDay);
    if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error("农历月必须是 1–12 的整数。");
    if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) throw new Error("农历日必须是 1–30 的整数。");
    return { requestVersion: "1.2.0", casting: { kind: "calendar", inputMode: "manual_lunar", calendarPolicyId: "manual-lunar-input-v1", timeInput: { kind: "manual_lunar", lunarMonth, lunarDay, earthlyBranchIndex: form.branchIndex, isLeapMonth: form.isLeapMonth } }, questionContext, displayPreferences };
  }
  if (form.castingMode === "three_number_variant") {
    if (![form.firstNumber, form.secondNumber, form.thirdNumber].every((value) => /^[0-9]*[1-9][0-9]*$/u.test(value.trim()))) throw new Error("三数起课的三个输入都必须是正整数。");
    return { requestVersion: "1.2.0", casting: { kind: "three_numbers", input: normalizeThreeNumberInput({ kind: "three_numbers", first: form.firstNumber, second: form.secondNumber, third: form.thirdNumber }) }, questionContext, displayPreferences };
  }
  const isCurrent = form.castingMode === "current_civil_time";
  const localDateTime = isCurrent ? form.currentDateTime : form.specifiedDateTime;
  const timezone = (isCurrent ? form.currentTimezone : form.specifiedTimezone).trim();
  const calendarPolicyId = isCurrent ? form.currentCalendarPolicyId : form.specifiedCalendarPolicyId;
  const fold = foldValue(isCurrent ? form.currentFold : form.specifiedFold);
  if (localDateTime.length === 0) throw new Error("请输入本地日期时间。");
  if (timezone.length === 0) throw new Error("请输入 IANA 时区，例如 Asia/Shanghai。");
  return { requestVersion: "1.2.0", casting: { kind: "calendar", inputMode: "civil_datetime", calendarPolicyId, timeInput: { kind: "civil_datetime", localDateTime, timezone, fold } }, questionContext, displayPreferences };
}

export default function App(): ReactElement {
  const domains = useMemo<readonly KnowledgeDomain[]>(() => listDomains(), []);
  const timeZones = useMemo(() => listSupportedTimeZones(), []);
  const archiveStore = useMemo<ArchiveStore>(() => createArchiveStore(), []);
  const [view, setView] = useState<AppView>("divination");
  const [form, setForm] = useState<FormState>(() => INITIAL_FORM);
  const [archiveRecords, setArchiveRecords] = useState<readonly ArchiveRecord[]>(() => {
    try { return archiveStore.list(); } catch { return []; }
  });
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(readThemePreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(detectSystemTheme);
  const [busy, setBusy] = useState(false);
  const [technicalDisclosureOpen, setTechnicalDisclosureOpen] = useState(false);
  const [structuredDetailsOpen, setStructuredDetailsOpen] = useState(false);
  const viewRef = useRef(view);
  const resultRef = useRef(result);
  const moreOpenRef = useRef(moreOpen);
  const technicalDisclosureOpenRef = useRef(technicalDisclosureOpen);
  const structuredDetailsOpenRef = useRef(structuredDetailsOpen);
  viewRef.current = view;
  resultRef.current = result;
  moreOpenRef.current = moreOpen;
  technicalDisclosureOpenRef.current = technicalDisclosureOpen;
  structuredDetailsOpenRef.current = structuredDetailsOpen;

  const selectedDomain = domains.find((domain) => domain.id === form.domainId) ?? domains[0];
  const stages = selectedDomain?.stageOptions ?? [];

  useEffect(() => {
    const root = document.documentElement;
    if (themePreference === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = themePreference;
    try { globalThis.localStorage?.setItem(THEME_STORAGE_KEY, themePreference); } catch { /* session-only theme */ }
    void syncNativeTheme(themePreference);
  }, [themePreference]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (): void => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    try { setArchiveRecords(archiveStore.list()); setArchiveError(null); }
    catch (archiveReadError) { setArchiveRecords([]); setArchiveError(readableError(archiveReadError)); }
  }, [archiveStore]);

  useEffect(() => {
    if (form.castingMode !== "current_civil_time") return;

    const refresh = (): void => {
      setForm((current) => current.castingMode === "current_civil_time"
        ? refreshCurrentTime(current, new Date(), current.currentTimezone)
        : current);
    };
    const refreshOnVisibility = (): void => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    const intervalId = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refreshOnVisibility);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, [form.castingMode]);

  useEffect(() => {
    if (!result || typeof window === "undefined" || !window.matchMedia("(max-width: 760px)").matches) return;
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>("#final-palace-result")?.scrollIntoView({ behavior: "auto", block: "start" }));
  }, [result]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let listenerHandle: PluginListenerHandle | null = null;
    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (moreOpenRef.current) { setMoreOpen(false); return; }
      if (technicalDisclosureOpenRef.current) { setTechnicalDisclosureOpen(false); return; }
      if (structuredDetailsOpenRef.current) { setStructuredDetailsOpen(false); return; }
      if (viewRef.current !== "divination") { setView("divination"); return; }
      if (resultRef.current !== null) { setResult(null); return; }
      void CapacitorApp.exitApp();
    });
    void listenerPromise.then((handle) => { if (active) listenerHandle = handle; else void handle.remove(); });
    return () => { active = false; if (listenerHandle) void listenerHandle.remove(); };
  }, []);

  const update: FormUpdater = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function changeView(nextView: AppView): void {
    setView(nextView);
    setMoreOpen(false);
  }

  function reloadArchive(): void {
    try { setArchiveRecords(archiveStore.list()); setArchiveError(null); }
    catch (archiveReadError) { setArchiveError(readableError(archiveReadError)); }
  }

  function saveResultToArchive(): void {
    if (!result) return;
    try {
      archiveStore.save(result);
      reloadArchive();
      setArchiveStatus("已保存到本地案例库。");
    } catch (archiveWriteError) { setArchiveStatus(readableError(archiveWriteError)); }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setTechnicalDisclosureOpen(false);
      setStructuredDetailsOpen(false);
      setResult(await runLocalDivination(buildRequest(form)));
    } catch (submissionError) {
      setError(readableError(submissionError));
      setResult(null);
    } finally { setBusy(false); }
  }

  function changeDomain(domainId: string): void {
    const nextStages = listStageOptions(domainId);
    setForm((current) => ({ ...current, domainId, stageId: nextStages[0]?.id ?? "" }));
  }

  return (
    <AppShell
      activeView={view}
      moreOpen={moreOpen}
      themeLabel={themeLabel(themePreference, systemTheme)}
      onChangeView={changeView}
      onMoreToggle={() => setMoreOpen((open) => !open)}
      onMoreClose={() => setMoreOpen(false)}
      onThemeToggle={() => setThemePreference((current) => nextThemePreference(current, systemTheme))}
    >
      {view === "archive" ? <ArchivePage records={archiveRecords} error={archiveError} onRecordsChange={reloadArchive} store={archiveStore} /> : null}
      {view === "library" ? <KnowledgeLibraryPage /> : null}
      {view === "methods" ? <MethodsPage /> : null}
      {view === "about" ? <AboutPage /> : null}
      {view === "divination" ? (
        <div className="divination-layout">
          <CastingPage
            form={form}
            domains={domains}
            stages={stages}
            timeZones={timeZones}
            modeOptions={CASTING_MODE_OPTIONS}
            flags={FLAG_OPTIONS}
            error={error}
            busy={busy}
            onUpdate={update}
            onModeChange={(mode) => setForm((current) => selectCastingMode(current, mode))}
            onDomainChange={changeDomain}
            onToggleFlag={(flag) => update("flags", form.flags.includes(flag) ? form.flags.filter((item) => item !== flag) : [...form.flags, flag])}
            onSubmit={(event) => { void submit(event); }}
            onCurrentTimezoneChange={(value) => setForm((current) => ({ ...current, currentTimezone: value, currentTimezoneFallback: false }))}
            onCurrentPolicyChange={(value) => update("currentCalendarPolicyId", civilPolicyOption(value))}
            onSpecifiedPolicyChange={(value) => update("specifiedCalendarPolicyId", civilPolicyOption(value))}
          />
          <section className="result-column">
            {result ? <ResultView result={result} domains={domains} technicalDisclosureOpen={technicalDisclosureOpen} structuredDetailsOpen={structuredDetailsOpen} archiveStatus={archiveStatus} archiveCapability={archiveStore.capability} onTechnicalDisclosureOpenChange={setTechnicalDisclosureOpen} onStructuredDetailsOpenChange={setStructuredDetailsOpen} onSaveToArchive={saveResultToArchive} /> : <section className="empty-state"><span className="section-kicker">02 · 结果</span><h2>结果会在这里展开</h2><p>提交后可查看主结果、对应路径、本地解释、来源和现实边界。</p></section>}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

export { CALENDAR_POLICIES };
