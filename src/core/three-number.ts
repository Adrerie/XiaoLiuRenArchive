import { PALACE_ORDER, type PalaceId } from "./index";
import type {
  PalaceIndex,
  PalaceOrder,
  ThreeNumberCalculationResult,
  ThreeNumberCalculationTrace,
  ThreeNumberInput,
  ThreePalace,
} from "../shared";

export type ThreeNumberField = "first" | "second" | "third";

export class ThreeNumberInputError extends Error {
  readonly field: ThreeNumberField;

  constructor(field: ThreeNumberField, message: string) {
    super(message);
    this.name = "ThreeNumberInputError";
    this.field = field;
  }
}

/** Normalize a user-entered positive decimal integer without going through Number. */
export function normalizeThreeNumber(value: string, field: ThreeNumberField): string {
  if (typeof value !== "string") {
    throw new ThreeNumberInputError(field, `${field} must be a decimal integer string`);
  }
  const trimmed = value.trim();
  if (!/^\d+$/u.test(trimmed)) {
    throw new ThreeNumberInputError(field, `${field} must contain only decimal digits`);
  }
  const normalized = trimmed.replace(/^0+(?=\d)/u, "");
  if (normalized === "0") {
    throw new ThreeNumberInputError(field, `${field} must be greater than zero`);
  }
  return normalized;
}

export function normalizeThreeNumberInput(input: ThreeNumberInput): ThreeNumberInput {
  return {
    kind: "three_numbers",
    first: normalizeThreeNumber(input.first, "first"),
    second: normalizeThreeNumber(input.second, "second"),
    third: normalizeThreeNumber(input.third, "third"),
  };
}

function palaceAt(index: number): PalaceId {
  return PALACE_ORDER[index] as PalaceId;
}

function palaceIndex(value: number): PalaceIndex {
  if (!Number.isInteger(value) || value < 0 || value >= PALACE_ORDER.length) {
    throw new Error(`Invalid six-palace index: ${value}`);
  }
  return value as PalaceIndex;
}

function normalizedOffset(value: string): PalaceIndex {
  return Number((BigInt(value) - 1n) % BigInt(PALACE_ORDER.length)) as PalaceIndex;
}

function createStep(
  stage: ThreeNumberCalculationTrace["stage"],
  ordinal: ThreePalace["ordinal"],
  startPalaceId: PalaceId,
  rawNumber: string,
): { readonly trace: ThreeNumberCalculationTrace; readonly palace: ThreePalace } {
  const startIndex = PALACE_ORDER.indexOf(startPalaceId);
  const offset = normalizedOffset(rawNumber);
  const resultIndex = palaceIndex((startIndex + offset) % PALACE_ORDER.length);
  const resultPalaceId = palaceAt(resultIndex);
  return {
    trace: {
      stage,
      startPalaceId,
      countValue: rawNumber,
      normalizedOffset: offset,
      resultIndex,
      resultPalaceId,
      formula: "(BigInt(number) - 1) mod 6; continue from the previous palace",
    },
    palace: {
      ordinal,
      rawNumber,
      startPalaceId,
      normalizedOffset: offset,
      palaceId: resultPalaceId,
    },
  };
}

export function computeThreeNumberCasting(input: ThreeNumberInput): ThreeNumberCalculationResult {
  const normalized = normalizeThreeNumberInput(input);
  const first = createStep("first_number", 1, palaceAt(0), normalized.first);
  const second = createStep("second_number", 2, first.palace.palaceId, normalized.second);
  const third = createStep("third_number", 3, second.palace.palaceId, normalized.third);
  const threePalaces = [first.palace, second.palace, third.palace] as const;

  return {
    algorithmId: "three-number-sequential-count-v1",
    algorithmStatus: "FROZEN-PROVISIONAL",
    palaceOrder: PALACE_ORDER as PalaceOrder,
    firstIndex: first.trace.resultIndex,
    secondIndex: second.trace.resultIndex,
    thirdIndex: third.trace.resultIndex,
    finalPalaceId: third.trace.resultPalaceId,
    threePalaces,
    primaryPalaceOrdinal: 3,
    primaryPalaceId: third.trace.resultPalaceId,
    trace: [first.trace, second.trace, third.trace],
  };
}
