/**
 * Frozen six-palace core for Xiao Liu Ren.
 *
 * This module deliberately accepts only normalized lunar month/day values and
 * a twelve-branch sequence number. Calendar normalization belongs elsewhere.
 */

export const PALACE_IDS = Object.freeze({
  DA_AN: "da_an",
  LIU_LIAN: "liu_lian",
  SU_XI: "su_xi",
  CHI_KOU: "chi_kou",
  XIAO_JI: "xiao_ji",
  KONG_WANG: "kong_wang",
} as const);

export const PALACE_ORDER = Object.freeze([
  PALACE_IDS.DA_AN,
  PALACE_IDS.LIU_LIAN,
  PALACE_IDS.SU_XI,
  PALACE_IDS.CHI_KOU,
  PALACE_IDS.XIAO_JI,
  PALACE_IDS.KONG_WANG,
] as const);

export type PalaceId = (typeof PALACE_ORDER)[number];
export type CoreStage = "month" | "day" | "hour";
export type CoreInputField =
  | "lunarMonth"
  | "lunarDay"
  | "earthlyBranchIndex";

export type CoreErrorCode =
  | "MISSING_INPUT_FIELD"
  | "NON_INTEGER_INPUT"
  | "INVALID_LUNAR_MONTH"
  | "INVALID_LUNAR_DAY"
  | "INVALID_EARTHLY_BRANCH_INDEX";

export interface DivinationCoreInput {
  lunarMonth: number;
  lunarDay: number;
  earthlyBranchIndex: number;
}

export interface PalaceStep {
  stage: CoreStage;
  startPalaceId: PalaceId;
  countValue: number;
  resultIndex: number;
  resultPalaceId: PalaceId;
  visitedPalaceIds: PalaceId[];
}

export interface DivinationCoreResult {
  algorithmVersion: "1.0.0";
  month: PalaceStep;
  day: PalaceStep;
  hour: PalaceStep;
  finalPalaceId: PalaceId;
}

export class CoreError extends Error {
  readonly code: CoreErrorCode;
  readonly field?: CoreInputField;

  constructor(code: CoreErrorCode, message: string, field?: CoreInputField) {
    super(message);
    this.name = "CoreError";
    this.code = code;
    this.field = field;
  }
}

const PALACE_COUNT = PALACE_ORDER.length;

/** Mathematical modulo, independent of a language's negative remainder rules. */
export function positiveMod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

function palaceIdAt(index: number): PalaceId {
  return PALACE_ORDER[index] as PalaceId;
}

function indexOfPalace(palaceId: PalaceId): number {
  const index = PALACE_ORDER.indexOf(palaceId);
  if (index < 0) {
    throw new Error(`Unknown palace id: ${palaceId}`);
  }
  return index;
}

function assertInteger(value: unknown, field: CoreInputField): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new CoreError(
      "NON_INTEGER_INPUT",
      `${field} must be a finite integer`,
      field,
    );
  }
}

function assertMonth(value: unknown): asserts value is number {
  assertInteger(value, "lunarMonth");
  if (value < 1 || value > 12) {
    throw new CoreError(
      "INVALID_LUNAR_MONTH",
      "lunarMonth must be in the range 1..12",
      "lunarMonth",
    );
  }
}

function assertDay(value: unknown): asserts value is number {
  assertInteger(value, "lunarDay");
  if (value < 1 || value > 30) {
    throw new CoreError(
      "INVALID_LUNAR_DAY",
      "lunarDay must be in the range 1..30",
      "lunarDay",
    );
  }
}

function assertEarthlyBranchIndex(value: unknown): asserts value is number {
  assertInteger(value, "earthlyBranchIndex");
  if (value < 1 || value > 12) {
    throw new CoreError(
      "INVALID_EARTHLY_BRANCH_INDEX",
      "earthlyBranchIndex must be in the range 1..12",
      "earthlyBranchIndex",
    );
  }
}

function requireInputField(
  input: unknown,
  field: CoreInputField,
): unknown {
  if (
    typeof input !== "object" ||
    input === null ||
    !(field in input) ||
    (input as Record<string, unknown>)[field] === undefined
  ) {
    throw new CoreError("MISSING_INPUT_FIELD", `${field} is required`, field);
  }
  return (input as Record<string, unknown>)[field];
}

function createStep(
  stage: CoreStage,
  startPalaceId: PalaceId,
  countValue: number,
): PalaceStep {
  const startIndex = indexOfPalace(startPalaceId);
  const resultIndex = positiveMod(startIndex + countValue - 1, PALACE_COUNT);
  const visitedPalaceIds = Array.from({ length: countValue }, (_, offset) =>
    palaceIdAt(positiveMod(startIndex + offset, PALACE_COUNT)),
  );

  return {
    stage,
    startPalaceId,
    countValue,
    resultIndex,
    resultPalaceId: palaceIdAt(resultIndex),
    visitedPalaceIds,
  };
}

/** Calculate the month palace from the fixed 大安 starting palace. */
export function calculateMonthStep(lunarMonth: number): PalaceStep {
  assertMonth(lunarMonth);
  return createStep("month", PALACE_IDS.DA_AN, lunarMonth);
}

/** Calculate the day palace from the month result palace. */
export function calculateDayStep(
  monthStep: Pick<PalaceStep, "resultPalaceId">,
  lunarDay: number,
): PalaceStep {
  assertDay(lunarDay);
  return createStep("day", monthStep.resultPalaceId, lunarDay);
}

/** Calculate the hour palace from the day result palace. */
export function calculateHourStep(
  dayStep: Pick<PalaceStep, "resultPalaceId">,
  earthlyBranchIndex: number,
): PalaceStep {
  assertEarthlyBranchIndex(earthlyBranchIndex);
  return createStep("hour", dayStep.resultPalaceId, earthlyBranchIndex);
}

/**
 * Execute the frozen month → day → hour formula and return its complete trace.
 */
export function computeDivination(
  input: DivinationCoreInput,
): DivinationCoreResult {
  const lunarMonth = requireInputField(input, "lunarMonth");
  const lunarDay = requireInputField(input, "lunarDay");
  const earthlyBranchIndex = requireInputField(input, "earthlyBranchIndex");

  // Validate in the contract's field order before any calculation.
  assertMonth(lunarMonth);
  assertDay(lunarDay);
  assertEarthlyBranchIndex(earthlyBranchIndex);

  const month = calculateMonthStep(lunarMonth);
  const day = calculateDayStep(month, lunarDay);
  const hour = calculateHourStep(day, earthlyBranchIndex);

  return {
    algorithmVersion: "1.0.0",
    month,
    day,
    hour,
    finalPalaceId: hour.resultPalaceId,
  };
}

