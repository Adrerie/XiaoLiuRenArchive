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

  it("resolves the stable Gregorian/IANA smoke path", async () => {
    const result = await runLocalDivination(request({
      inputMode: "civil_datetime",
      calendarPolicyId: "civil-midnight-reuse-leap-month",
      timeInput: {
        kind: "civil_datetime",
        localDateTime: "2024-02-10T12:00",
        timezone: "Asia/Shanghai",
        fold: null,
      },
    }));

    expect(result.input.inputMode).toBe("civil_datetime");
    expect(result.calendar.localDateTime).toBe("2024-02-10T12:00:00");
    expect(result.calendar.timezone).toBe("Asia/Shanghai");
    expect(result.calendar.resolvedLunarDate).toMatchObject({ month: 1, day: 1, isLeapMonth: false });
    expect(result.calendar.earthlyBranch).toBe("wu");
    expect(result.calendar.calendarPolicyId).toBe("civil-midnight-reuse-leap-month");
  });

  it("aggregates final display provenance and disputed palace fields", async () => {
    const result = await runLocalDivination(request());
    const displayedIds = Object.values(result.interpretation.sections).flat().map((block) => block.id);

    expect(new Set(result.provenance.fragmentIds)).toEqual(new Set(displayedIds));
    expect(result.provenance.sourceIds).toEqual(expect.arrayContaining([
      "moe-revised-dictionary-xiaoliuren",
      "yuxiaji-liuren-shike-web-transcription-8s8s",
      "xiaoliurenarchive-editorial-modern-knowledge-v1",
    ]));
    expect(result.interpretation.sections.domain.every((block) => block.sourceIds.includes("xiaoliurenarchive-editorial-modern-knowledge-v1"))).toBe(true);
    expect(result.interpretation.sections.traditionalText.every((block) => block.sourceIds.includes("yuxiaji-liuren-shike-web-transcription-8s8s"))).toBe(true);
    expect(result.provenance.disputedFieldIds).toContain("palace.xiao_ji.classical.element");
    expect(result.provenance.provisionalSourceIds.every((id) => result.provenance.sourceIds.includes(id))).toBe(true);
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

  it("routes relationship domain guidance through consent filtering", async () => {
    const result = await runLocalDivination(request({
      questionContext: {
        domainId: "relationship",
        stageId: "seeking",
        flags: [],
        facts: { explicitRefusalExists: true, immediateSafetyRisk: false },
      },
    }));

    expect(result.calculation.finalPalaceId).toBe("xiao_ji");
    expect(result.ethics.mode).toBe("hard_block");
    expect(result.ethics.triggeredRuleIds).toContain("consent-overrides-divination");
    expect(result.ethics.requiredNotices).toContain("现实中已经表达的拒绝、撤回或边界优先于任何占断。结果不能被解释为对方其实同意，也不能成为继续纠缠的理由。");

    const displayedBlocks = Object.values(result.interpretation.sections).flat();
    const displayedTexts = displayedBlocks.map((block) => block.text);
    expect(displayedTexts).not.toContain("关系可通过朋友、共同社群、协商和日常互动逐步改善。");
    expect(displayedTexts).not.toContain("适合接受介绍、共同完成事情或建立可持续的小约定。");
    expect(displayedTexts).not.toContain("把好感转化为清晰且可拒绝的邀请");
    expect(displayedTexts).toContain("积极合作不等于恋爱同意，朋友善意也不代表对方具有某种性取向。");

    expect(result.ethics.blockedFragmentIds).toEqual(expect.arrayContaining([
      "relationship.xiao_ji.summary",
      "relationship.xiao_ji.supportive",
      "relationship.xiao_ji.action.1",
      "relationship.xiao_ji.action.2",
    ]));
    expect(result.ethics.suppressedClaims.map((claim) => claim.claimId)).toEqual(expect.arrayContaining([
      "relationship.xiao_ji.summary.domain_summary",
      "relationship.xiao_ji.supportive.domain_supportive",
      "relationship.xiao_ji.action.1.domain_action",
      "relationship.xiao_ji.action.2.domain_action",
    ]));
    expect(result.ethics.retainedFragmentIds).toEqual(result.interpretation.fragmentIds);
    expect(result.ethics.retainedClaimIds).toEqual(result.interpretation.candidateClaimIds);
    expect(result.interpretation.candidateClaimIds).toContain("relationship.xiao_ji.caution.domain_caution");
    expect(result.interpretation.candidateClaimIds).not.toContain("relationship.xiao_ji.summary.domain_summary");
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
    expect(result.ethics.retainedFragmentIds).toEqual(result.interpretation.fragmentIds);
    const displayedIds = Object.values(result.interpretation.sections).flat().map((block) => block.id);
    expect(new Set(result.interpretation.fragmentIds)).toEqual(new Set(displayedIds));
    expect(result.ethics.blockedFragmentIds.every((id) => !displayedIds.includes(id))).toBe(true);
    expect(result.ethics.suppressedClaims.flatMap((claim) => claim.fragmentIds).every((id) => !displayedIds.includes(id))).toBe(true);
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
    expect(result.ethics.requiredNotices.length).toBeGreaterThan(0);
    expect(result.ethics.requiredRealityActionCodes).toContain("contact_emergency_services_and_relevant_people");
    expect(result.ethics.retainedFragmentIds).toEqual([]);
    expect(result.interpretation.fragmentIds).toEqual([]);
    expect(Object.values(result.interpretation.sections).every((section) => section.length === 0)).toBe(true);
  });
});
