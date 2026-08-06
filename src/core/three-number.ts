import { PALACE_ORDER, positiveMod, type PalaceId } from "./index";
import type {
  PalaceIndex,
  PalaceOrder,
  ThreeNumberCalculationResult,
  ThreeNumberCalculationTrace,
  ThreeNumberInput,
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

function assertPositiveInteger(value: unknown, field: ThreeNumberField): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new ThreeNumberInputError(field, `${field} must be a positive integer`);
  }
}

function palaceAt(index: number): PalaceId {
  return PALACE_ORDER[index] as PalaceId;
}

function indexOfPalace(palaceId: PalaceId): PalaceIndex {
  return PALACE_ORDER.indexOf(palaceId) as PalaceIndex;
}

function createStep(
  stage: ThreeNumberCalculationTrace["stage"],
  startPalaceId: PalaceId,
  countValue: number,
): ThreeNumberCalculationTrace {
  const startIndex = indexOfPalace(startPalaceId);
  const normalizedOffset = positiveMod(countValue - 1, PALACE_ORDER.length) as PalaceIndex;
  const resultIndex = positiveMod(startIndex + normalizedOffset, PALACE_ORDER.length) as PalaceIndex;
  return {
    stage,
    startPalaceId,
    countValue,
    normalizedOffset,
    resultIndex,
    resultPalaceId: palaceAt(resultIndex),
    formula: "positiveMod(startIndex + number - 1, 6)",
  };
}

export function computeThreeNumberCasting(input: ThreeNumberInput): ThreeNumberCalculationResult {
  assertPositiveInteger(input.first, "first");
  assertPositiveInteger(input.second, "second");
  assertPositiveInteger(input.third, "third");

  const first = createStep("first_number", palaceAt(0), input.first);
  const second = createStep("second_number", first.resultPalaceId, input.second);
  const third = createStep("third_number", second.resultPalaceId, input.third);

  return {
    algorithmId: "three-number-sequential-count-v1",
    algorithmStatus: "FROZEN-PROVISIONAL",
    palaceOrder: PALACE_ORDER as PalaceOrder,
    firstIndex: first.resultIndex,
    secondIndex: second.resultIndex,
    thirdIndex: third.resultIndex,
    finalPalaceId: third.resultPalaceId,
    trace: [first, second, third],
  };
}
