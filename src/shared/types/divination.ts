export type CalendarInputMode = "manual_lunar" | "civil_datetime";
export type InputMode = CalendarInputMode | "three_numbers";

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

export interface ThreeNumberInput {
  readonly kind: "three_numbers";
  readonly first: string;
  readonly second: string;
  readonly third: string;
}

export interface CalendarCastingRequest {
  readonly kind: "calendar";
  readonly inputMode: CalendarInputMode;
  readonly calendarPolicyId: string;
  readonly timeInput: TimeInput;
}

export interface ThreeNumberCastingRequest {
  readonly kind: "three_numbers";
  readonly input: ThreeNumberInput;
}

export type CastingRequest = CalendarCastingRequest | ThreeNumberCastingRequest;

export interface DisplayPreferences {
  readonly language: "zh-CN" | "zh-TW";
  readonly showTraditionalText: boolean;
  readonly showSourceTrace: boolean;
  readonly showCalculationTrace: boolean;
  readonly reducedMotion?: boolean;
}

export type QuestionFactValue = boolean | number | string | null;

export interface QuestionContext {
  readonly domainId?: string;
  readonly stageId?: string | null;
  readonly flags?: readonly string[];
  readonly facts?: Readonly<Record<string, QuestionFactValue>>;
  readonly questionText?: string;
  readonly identityFieldsChanged?: boolean;
  readonly privacy?: {
    readonly questionTextStored?: boolean;
    readonly questionTextIncludedInExport?: boolean;
  };
  readonly [key: string]: unknown;
}

export interface DivinationRequest {
  readonly requestVersion: "1.2.0";
  readonly casting: CastingRequest;
  readonly questionContext: QuestionContext;
  readonly displayPreferences: DisplayPreferences;
  readonly clientMetadata?: Readonly<{
    readonly appVersion?: string | null;
    readonly platform?: string | null;
    readonly locale?: string | null;
  }>;
}

export interface TraditionalCalculationInput {
  readonly kind: "calendar";
  readonly lunarMonth: number;
  readonly lunarDay: number;
  readonly earthlyBranchIndex: number;
}

export interface ThreeNumberCalculationInput extends ThreeNumberInput {
  readonly kind: "three_numbers";
}

export type CalculationInput = TraditionalCalculationInput | ThreeNumberCalculationInput;

interface ResultInputContext {
  readonly timezone: string | null;
  readonly domainId: string;
  readonly stageId: string | null;
  readonly questionFlags: readonly string[];
  readonly privacy: {
    readonly questionTextStored: boolean;
    readonly questionTextIncludedInExport: boolean;
  };
}

export interface CalendarResultInput extends ResultInputContext {
  readonly kind: "calendar";
  readonly inputMode: CalendarInputMode;
  readonly localDateTime: string | null;
  readonly lunarMonth: number;
  readonly lunarDay: number;
  readonly isLeapMonth: boolean;
  readonly earthlyBranch: EarthlyBranch;
  readonly earthlyBranchIndex: number;
}

export interface ThreeNumberResultInput extends ResultInputContext {
  readonly kind: "three_numbers";
  readonly numbers: ThreeNumberInput;
}

export type ResultInput = CalendarResultInput | ThreeNumberResultInput;

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

export interface TraditionalCalculationResult {
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

export interface ThreeNumberCalculationTrace {
  readonly stage: "first_number" | "second_number" | "third_number";
  readonly startPalaceId: PalaceId;
  readonly countValue: string;
  readonly normalizedOffset: PalaceIndex;
  readonly resultIndex: PalaceIndex;
  readonly resultPalaceId: PalaceId;
  readonly formula: string;
}

export interface ThreePalace {
  readonly ordinal: 1 | 2 | 3;
  readonly rawNumber: string;
  readonly startPalaceId: PalaceId;
  readonly normalizedOffset: PalaceIndex;
  readonly palaceId: PalaceId;
}

export interface ThreeNumberCalculationResult {
  readonly algorithmId: "three-number-sequential-count-v1";
  readonly algorithmStatus: "FROZEN-PROVISIONAL";
  readonly palaceOrder: PalaceOrder;
  readonly firstIndex: PalaceIndex;
  readonly secondIndex: PalaceIndex;
  readonly thirdIndex: PalaceIndex;
  readonly finalPalaceId: PalaceId;
  readonly threePalaces: readonly [ThreePalace, ThreePalace, ThreePalace];
  readonly primaryPalaceOrdinal: 3;
  readonly primaryPalaceId: PalaceId;
  readonly trace: readonly [ThreeNumberCalculationTrace, ThreeNumberCalculationTrace, ThreeNumberCalculationTrace];
}

export type CalculationResult = TraditionalCalculationResult | ThreeNumberCalculationResult;

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
  readonly relationshipCurrentState: readonly ContentBlock[];
  readonly ethicsNotices: readonly ContentBlock[];
}

export interface InterpretationResult {
  readonly domainId: string;
  readonly stageId: string | null;
  readonly certaintyMode: "symbolic-non-deterministic";
  readonly sections: InterpretationSections;
  readonly fragmentIds: readonly string[];
  readonly candidateClaimIds: readonly string[];
  readonly candidateClaims?: readonly CandidateClaim[];
  readonly selectedFragments?: readonly SelectedFragment[];
  readonly trace: readonly Record<string, unknown>[];
}

export interface CandidateClaim {
  readonly id: string;
  readonly claimType: string;
  readonly sourceKind: "palace" | "domain" | "stage" | "user_fact" | "historical_text";
  readonly fragmentIds: readonly string[];
  readonly text: string;
  readonly certainty: "descriptive" | "tentative" | "strong";
  readonly tags: readonly string[];
}

export interface SelectedFragment {
  readonly id: string;
  readonly tags: readonly string[];
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
  readonly calendarPolicyId: string | null;
  readonly algorithmId: CalculationResult["algorithmId"];
  readonly methodId: CalculationResult["algorithmId"];
  readonly methodVersion: string;
  readonly methodSourceIds: readonly string[];
  readonly fragmentIds: readonly string[];
  readonly ethicsRuleIds: readonly string[];
}

export type CastingSummary =
  | {
      readonly kind: "calendar";
      readonly inputMode: CalendarInputMode;
      readonly calendarPolicyId: string;
    }
  | {
      readonly kind: "three_numbers";
      readonly algorithmId: "three-number-sequential-count-v1";
      readonly input: ThreeNumberInput;
    };

export interface DivinationResult {
  readonly resultVersion: "1.3.0";
  readonly createdAt: string | null;
  readonly casting: CastingSummary;
  readonly input: ResultInput;
  readonly calendar: CalendarResult | null;
  readonly calculation: CalculationResult;
  readonly interpretation: InterpretationResult;
  readonly ethics: EthicsResult;
  readonly provenance: Provenance;
}
