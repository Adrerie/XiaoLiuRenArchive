export type EarthlyBranch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type CalendarErrorCode =
  | 'CALENDAR_POLICY_INVALID'
  | 'CALENDAR_TIMEZONE_INVALID'
  | 'CALENDAR_LOCAL_DATETIME_INVALID'
  | 'CALENDAR_LOCAL_TIME_NONEXISTENT'
  | 'CALENDAR_LOCAL_TIME_AMBIGUOUS'
  | 'CALENDAR_LUNAR_MONTH_INVALID'
  | 'CALENDAR_LUNAR_DAY_INVALID'
  | 'CALENDAR_LUNAR_YEAR_INVALID'
  | 'CALENDAR_EARTHLY_BRANCH_INVALID'
  | 'CALENDAR_EARTHLY_BRANCH_CONFLICT'
  | 'CALENDAR_LEAP_MONTH_FLAG_INVALID'
  | 'CALENDAR_LUNAR_DATE_INVALID'
  | 'CALENDAR_RUNTIME_UNAVAILABLE';

export type CalendarPolicyId =
  | 'civil-midnight-reuse-leap-month'
  | 'zi-hour-23-reuse-leap-month'
  | 'manual-lunar-input-v1';

export interface CalendarPolicyDefinition {
  readonly id: CalendarPolicyId;
  readonly label: string;
  readonly description: string;
  readonly warning: string;
}

export interface CalendarNormalizationErrorShape {
  code: CalendarErrorCode;
  message: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export class CalendarNormalizationError extends Error implements CalendarNormalizationErrorShape {
  readonly name: 'CalendarNormalizationError';
  readonly code: CalendarErrorCode;
  readonly recoverable: boolean;
  readonly suggestedAction?: string;
}

export interface ManualLunarInput {
  kind?: 'manual_lunar';
  lunarYear?: number | null;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  earthlyBranchIndex?: number;
  earthlyBranch?: EarthlyBranch;
  timezone?: string | null;
  calendarPolicyId?: string;
}

export interface GregorianDateTimeInput {
  kind?: 'civil_datetime';
  localDateTime: string;
  timezone: string;
  fold?: 0 | 1 | null;
  calendarPolicyId?: string;
}

export interface NormalizedDivinationTime {
  source: 'gregorian_datetime' | 'manual_lunar';
  timeZone: string;
  localDateTime?: string;
  lunarYear?: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  earthlyBranch: EarthlyBranch;
  earthlyBranchIndex: number;
  calendarPolicyId: CalendarPolicyId;
  libraryId?: string;
  libraryVersion?: string;
  warnings: string[];
}

export interface ManualValidationResult {
  valid: true;
  branch: { earthlyBranch: EarthlyBranch; earthlyBranchIndex: number };
  warnings: string[];
}

export interface CalendarAdapter {
  readonly id: string;
  readonly version: string;
  fromGregorian(input: GregorianDateTimeInput): NormalizedDivinationTime;
  validateManualLunar(input: ManualLunarInput): ManualValidationResult;
  fromManualLunar(input: ManualLunarInput): NormalizedDivinationTime;
}

export const DEFAULT_CALENDAR_POLICY_ID: 'civil-midnight-reuse-leap-month';
export const CALENDAR_POLICIES: readonly CalendarPolicyDefinition[];
export const EARTHLY_BRANCHES: readonly EarthlyBranch[];
export const MANUAL_TIME_ZONE: 'manual';
export const POLICY_IDS: readonly string[];
export const CALENDAR_ERROR_CODES: Readonly<Record<string, CalendarErrorCode>>;
export const calendarAdapter: CalendarAdapter;
export function fromGregorian(input: GregorianDateTimeInput): NormalizedDivinationTime;
export function fromManualLunar(input: ManualLunarInput): NormalizedDivinationTime;
export function validateManualLunar(input: ManualLunarInput): ManualValidationResult;
export function isCalendarNormalizationError(error: unknown): error is CalendarNormalizationError;
