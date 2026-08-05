export type InputMode = "manual_lunar" | "civil_datetime";

export type PalaceId =
  | "da_an"
  | "liu_lian"
  | "su_xi"
  | "chi_kou"
  | "xiao_ji"
  | "kong_wang";

export type PalaceIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type PalaceOrder = readonly [
  "da_an",
  "liu_lian",
  "su_xi",
  "chi_kou",
  "xiao_ji",
  "kong_wang",
];

export type EarthlyBranch =
  | "zi"
  | "chou"
  | "yin"
  | "mao"
  | "chen"
  | "si"
  | "wu"
  | "wei"
  | "shen"
  | "you"
  | "xu"
  | "hai";

export interface ManualLunarTimeInput {
  readonly kind: "manual_lunar";
  readonly lunarMonth: number;
  readonly lunarDay: number;
  readonly earthlyBranchIndex: number;
  readonly isLeapMonth: boolean;
  readonly timezone?: string | null;
}

export interface CivilDateTimeInput {
  readonly kind: "civil_datetime";
  readonly localDateTime: string;
  readonly timezone: string;
  readonly fold?: 0 | 1 | null;
}

export type TimeInput = ManualLunarTimeInput | CivilDateTimeInput;

export interface DisplayPreferences {
  readonly language: "zh-CN" | "zh-TW";
  readonly showTraditionalText: boolean;
  readonly showSourceTrace: boolean;
  readonly showCalculationTrace: boolean;
  readonly reducedMotion?: boolean;
}

/** Kept opaque until the question-context contract is owned by its module. */
export type QuestionContext = Readonly<Record<string, unknown>>;

export interface DivinationRequest {
  readonly requestVersion: "1.0.0";
  readonly inputMode: InputMode;
  readonly calendarPolicyId: string;
  readonly timeInput: TimeInput;
  readonly questionContext: QuestionContext;
  readonly displayPreferences: DisplayPreferences;
  readonly clientMetadata?: Readonly<{
    readonly appVersion?: string | null;
    readonly platform?: string | null;
    readonly locale?: string | null;
  }>;
}

export interface CalculationInput {
  readonly lunarMonth: number;
  readonly lunarDay: number;
  readonly earthlyBranchIndex: number;
}

export interface ResultInput {
  readonly inputMode: InputMode;
  readonly timezone: string | null;
  readonly localDateTime?: string | null;
  readonly lunarMonth: number;
  readonly lunarDay: number;
  readonly isLeapMonth: boolean;
  readonly earthlyBranch: EarthlyBranch;
  readonly earthlyBranchIndex: number;
  readonly domainId: string;
  readonly stageId: string | null;
  readonly questionFlags: readonly string[];
  readonly privacy: {
    readonly questionTextStored: boolean;
    readonly questionTextIncludedInExport: boolean;
  };
}

export interface ResolvedLunarDate {
  readonly year: number | null;
  readonly month: number;
  readonly day: number;
  readonly isLeapMonth: boolean;
}

export interface BoundaryDecision {
  readonly mode: "civil_midnight" | "zi_hour_23" | "split_early_late_zi";
  readonly appliedDayOffset: -1 | 0 | 1;
  readonly manualInputBypass: boolean;
}

export interface CalendarTrace {
  readonly stage: string;
  readonly [key: string]: unknown;
}

export interface CalendarResult {
  readonly calendarPolicyId: string;
  readonly localDateTime?: string | null;
  readonly timezone?: string | null;
  readonly resolvedLunarDate: ResolvedLunarDate;
  readonly earthlyBranch: EarthlyBranch;
  readonly earthlyBranchIndex: number;
  readonly boundaryDecision: BoundaryDecision;
  readonly trace: readonly CalendarTrace[];
  readonly warnings: readonly string[];
}

export interface CalculationTrace {
  readonly stage: "month" | "day" | "hour";
  readonly startPalaceId: PalaceId;
  readonly countValue: number;
  readonly offset: number;
  readonly resultIndex: PalaceIndex;
  readonly resultPalaceId: PalaceId;
  readonly formula: string;
}

export interface CalculationResult {
  readonly algorithmId: "traditional-month-day-hour-v1";
  readonly algorithmStatus: "FROZEN-PROVISIONAL" | "FROZEN-REVIEWED";
  readonly palaceOrder: PalaceOrder;
  readonly monthIndex: PalaceIndex;
  readonly dayIndex: PalaceIndex;
  readonly hourIndex: PalaceIndex;
  readonly monthPalaceId: PalaceId;
  readonly dayPalaceId: PalaceId;
  readonly finalPalaceId: PalaceId;
  readonly trace: readonly [CalculationTrace, CalculationTrace, CalculationTrace];
}

export interface ContentBlock {
  readonly id: string;
  readonly text: string;
  readonly kind: string;
  readonly sourceIds: readonly string[];
  readonly status: "provisional" | "reviewed" | "canonical" | "disputed";
}

export interface InterpretationSections {
  readonly neutral: readonly ContentBlock[];
  readonly domain: readonly ContentBlock[];
  readonly stage: readonly ContentBlock[];
  readonly actions: readonly ContentBlock[];
  readonly traditionalText: readonly ContentBlock[];
  readonly historicalContext: readonly ContentBlock[];
  readonly realityChecks: readonly ContentBlock[];
  readonly ethicsNotices: readonly ContentBlock[];
}

export interface InterpretationResult {
  readonly domainId: string;
  readonly stageId: string | null;
  readonly certaintyMode: "symbolic-non-deterministic";
  readonly sections: InterpretationSections;
  readonly fragmentIds: readonly string[];
  readonly candidateClaimIds: readonly string[];
  readonly trace: readonly Record<string, unknown>[];
}

export interface SuppressedClaim {
  readonly claimId: string;
  readonly claimType: string;
  readonly ruleId: string;
  readonly fragmentIds: readonly string[];
  readonly reasonCode: string;
}

export interface EthicsResult {
  readonly mode: "allow" | "allow_with_constraints" | "hard_block" | "hard_stop";
  readonly evaluatedRuleIds: readonly string[];
  readonly triggeredRuleIds: readonly string[];
  readonly retainedClaimIds: readonly string[];
  readonly suppressedClaims: readonly SuppressedClaim[];
  readonly retainedFragmentIds: readonly string[];
  readonly blockedFragmentIds: readonly string[];
  readonly forcedConclusionCodes: readonly string[];
  readonly requiredNotices: readonly string[];
  readonly requiredRealityActionCodes: readonly string[];
  readonly contextCodes: readonly string[];
  readonly allowedTopics: readonly string[];
  readonly forbiddenActionTypes: readonly string[];
  readonly preferredTerms: readonly string[];
  readonly forbiddenTerms: readonly string[];
  readonly stopPrimaryDivination: boolean;
  readonly trace: readonly Record<string, unknown>[];
}

export interface Provenance {
  readonly knowledgeVersion: string;
  readonly ruleVersion: string;
  readonly schemaVersions: Readonly<Record<string, string>>;
  readonly sourceIds: readonly string[];
  readonly provisionalSourceIds: readonly string[];
  readonly disputedFieldIds: readonly string[];
  readonly calendarPolicyId: string;
  readonly algorithmId: "traditional-month-day-hour-v1";
  readonly fragmentIds: readonly string[];
  readonly ethicsRuleIds: readonly string[];
}

export interface DivinationResult {
  readonly resultVersion: "1.1.0";
  readonly createdAt: string | null;
  readonly input: ResultInput;
  readonly calendar: CalendarResult;
  readonly calculation: CalculationResult;
  readonly interpretation: InterpretationResult;
  readonly ethics: EthicsResult;
  readonly provenance: Provenance;
}
