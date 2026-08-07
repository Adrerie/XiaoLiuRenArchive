import { describe, expect, it } from "vitest";
import { computeThreeNumberCasting, ThreeNumberInputError } from "./three-number.ts";

describe("three-number casting", () => {
  it("computes the modern three-number 3,5,5 variant without calendar fields", () => {
    const result = computeThreeNumberCasting({ kind: "three_numbers", first: 3, second: 5, third: 5 });

    expect(result.algorithmId).toBe("three-number-sequential-count-v1");
    expect(result.trace.map((step) => step.stage)).toEqual(["first_number", "second_number", "third_number"]);
    expect(result.trace.map((step) => step.resultPalaceId)).toEqual(["su_xi", "da_an", "xiao_ji"]);
    expect(result.finalPalaceId).toBe("xiao_ji");
    expect("monthIndex" in result).toBe(false);
    expect("lunarMonth" in result).toBe(false);
  });

  it("handles large positive numbers with bounded modular arithmetic", () => {
    const result = computeThreeNumberCasting({
      kind: "three_numbers",
      first: Number.MAX_SAFE_INTEGER,
      second: 7,
      third: 13,
    });

    expect(result.trace).toHaveLength(3);
    expect(result.trace.every((step) => step.normalizedOffset >= 0 && step.normalizedOffset < 6)).toBe(true);
  });

  it("rejects empty, zero, negative, fractional and non-finite numbers", () => {
    const invalidInputs = [
      { kind: "three_numbers" as const, first: 0, second: 1, third: 1 },
      { kind: "three_numbers" as const, first: -1, second: 1, third: 1 },
      { kind: "three_numbers" as const, first: 1.5, second: 1, third: 1 },
      { kind: "three_numbers" as const, first: Number.NaN, second: 1, third: 1 },
    ];

    for (const input of invalidInputs) {
      expect(() => computeThreeNumberCasting(input)).toThrow(ThreeNumberInputError);
    }
  });
});
