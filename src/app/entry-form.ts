import type { CalendarPolicyId } from "../calendar";

export type CastingMode =
  | "current_civil_time"
  | "specified_civil_time"
  | "manual_lunar_time"
  | "three_number_variant";

export type FoldSelection = "" | "0" | "1";

export interface TimeZoneDetection {
  readonly timeZone: string;
  readonly usedFallback: boolean;
}

export interface FormState {
  readonly castingMode: CastingMode;
  readonly currentDateTime: string;
  readonly currentTimezone: string;
  readonly currentTimezoneFallback: boolean;
  readonly currentFold: FoldSelection;
  readonly currentCalendarPolicyId: Exclude<CalendarPolicyId, "manual-lunar-input-v1">;
  readonly specifiedDateTime: string;
  readonly specifiedTimezone: string;
  readonly specifiedFold: FoldSelection;
  readonly specifiedCalendarPolicyId: Exclude<CalendarPolicyId, "manual-lunar-input-v1">;
  readonly lunarMonth: string;
  readonly lunarDay: string;
  readonly branchIndex: number;
  readonly isLeapMonth: boolean;
  readonly firstNumber: string;
  readonly secondNumber: string;
  readonly thirdNumber: string;
  readonly domainId: string;
  readonly stageId: string;
  readonly explicitRefusalExists: boolean;
  readonly flags: readonly string[];
}

export function normalizeTimeZone(candidate: string | undefined): TimeZoneDetection {
  const timeZone = candidate?.trim() ?? "";
  if (timeZone.length === 0) return { timeZone: "UTC", usedFallback: true };
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(0));
    return { timeZone, usedFallback: false };
  } catch {
    return { timeZone: "UTC", usedFallback: true };
  }
}

export function detectLocalTimeZone(): TimeZoneDetection {
  let detected: string | undefined;
  try {
    detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    detected = undefined;
  }
  return normalizeTimeZone(detected);
}

export function formatLocalDateTime(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");
  const hour = values.get("hour");
  const minute = values.get("minute");
  if (!year || !month || !day || !hour || !minute) {
    throw new Error("无法格式化当前设备时间。");
  }
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function createInitialForm(
  now: Date = new Date(),
  detectedTimeZone?: string,
): FormState {
  const detection = detectedTimeZone === undefined
    ? detectLocalTimeZone()
    : normalizeTimeZone(detectedTimeZone);
  const localDateTime = formatLocalDateTime(now, detection.timeZone);
  return {
    castingMode: "current_civil_time",
    currentDateTime: localDateTime,
    currentTimezone: detection.timeZone,
    currentTimezoneFallback: detection.usedFallback,
    currentFold: "",
    currentCalendarPolicyId: "civil-midnight-reuse-leap-month",
    specifiedDateTime: localDateTime,
    specifiedTimezone: detection.timeZone,
    specifiedFold: "",
    specifiedCalendarPolicyId: "civil-midnight-reuse-leap-month",
    lunarMonth: "3",
    lunarDay: "5",
    branchIndex: 5,
    isLeapMonth: false,
    firstNumber: "",
    secondNumber: "",
    thirdNumber: "",
    domainId: "relationship",
    stageId: "seeking",
    explicitRefusalExists: false,
    flags: [],
  };
}

export function refreshCurrentTime(
  form: FormState,
  now: Date = new Date(),
  detectedTimeZone?: string,
): FormState {
  const detection = detectedTimeZone === undefined
    ? detectLocalTimeZone()
    : normalizeTimeZone(detectedTimeZone);
  return {
    ...form,
    currentDateTime: formatLocalDateTime(now, detection.timeZone),
    currentTimezone: detection.timeZone,
    currentTimezoneFallback: detection.usedFallback,
  };
}

export function selectCastingMode(
  form: FormState,
  mode: CastingMode,
  now: Date = new Date(),
  detectedTimeZone?: string,
): FormState {
  if (mode === "current_civil_time") {
    return { ...refreshCurrentTime(form, now, detectedTimeZone), castingMode: mode };
  }
  return { ...form, castingMode: mode };
}

export function formatTimeZoneWarning(timeZone: TimeZoneDetection): string | null {
  return timeZone.usedFallback ? "无法识别设备时区，已回退 UTC；你可以手动选择或输入 IANA 时区。" : null;
}

export const INITIAL_FORM: FormState = createInitialForm();
