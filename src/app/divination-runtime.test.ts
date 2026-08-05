import { describe, expect, it } from "vitest";
import { runLocalDivination } from "./divination-runtime";
import type { DivinationRequest } from "../shared";

function request(overrides: Partial<DivinationRequest> = {}): DivinationRequest {
  return {
    requestVersion: "1.0.0",
    inputMode: "manual_lunar",
    calendarPolicyId: "manual-lunar-input-v1",
    timeInput: {
      kind: "manual_lunar",
      lunarMonth: 3,
      lunarDay: 5,
      earthlyBranchIndex: 5,
      isLeapMonth: false,
    },
    questionContext: {
      domainId: "relationship",
      stageId: "seeking",
      flags: [],
      facts: { explicitRefusalExists: false, immediateSafetyRisk: false },
    },
    displayPreferences: {
      language: "zh-CN",
      showTraditionalText: true,
      showSourceTrace: true,
      showCalculationTrace: true,
    },
    ...overrides,
  };
}

describe("local divination runtime", () => {
  it("runs the manual lunar milestone and preserves a full trace", async () => {
    const result = await runLocalDivination(request());

    expect(result.calculation.finalPalaceId).toBe("xiao_ji");
    expect(result.calculation.trace.map((step) => step.stage)).toEqual(["month", "day", "hour"]);
    expect(result.calendar.boundaryDecision.manualInputBypass).toBe(true);
    expect(result.input.privacy.questionTextStored).toBe(false);
  });

  it("does not let identity flags alter the final palace", async () => {
    const plain = await runLocalDivination(request());
    const identity = await runLocalDivination(request({
      questionContext: {
        domainId: "relationship",
        stageId: "dating",
        flags: ["third_party_identity"],
        facts: { explicitRefusalExists: false, immediateSafetyRisk: false },
      },
    }));

    expect(identity.calculation.finalPalaceId).toBe(plain.calculation.finalPalaceId);
    expect(identity.ethics.mode).toBe("hard_block");
    expect(identity.ethics.triggeredRuleIds).toContain("no-third-party-orientation-inference");
  });

  it.each([
    ["refusal", "relationship", "hard_block", { explicitRefusalExists: true }],
    ["health", "health", "hard_block", { explicitRefusalExists: false }],
    ["finance", "finance", "hard_block", { explicitRefusalExists: false }],
  ] as const)("applies the %s safety guard", async (_name, domainId, mode, facts) => {
    const result = await runLocalDivination(request({
      questionContext: { domainId, stageId: null, flags: [], facts: { ...facts, immediateSafetyRisk: false } },
    }));
    expect(result.ethics.mode).toBe(mode);
    expect(result.ethics.triggeredRuleIds.length).toBeGreaterThan(0);
  });

  it("hard-stops when a missing person may be in danger", async () => {
    const result = await runLocalDivination(request({
      questionContext: {
        domainId: "travel_mobility",
        stageId: null,
        flags: ["missing_person"],
        facts: { explicitRefusalExists: false, immediateSafetyRisk: true },
      },
    }));
    expect(result.ethics.mode).toBe("hard_stop");
    expect(result.ethics.stopPrimaryDivination).toBe(true);
    expect(result.calculation.finalPalaceId).toBe("xiao_ji");
  });
});
