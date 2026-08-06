import type {
  CalculationResult,
  CalendarResult,
  DivinationRequest,
  EthicsResult,
  InterpretationResult,
  Provenance,
  ResultInput,
} from "../shared";
import { describe, expect, it } from "vitest";
import { runDivination, type DivinationDependencies } from "./divination-service";

const request: DivinationRequest = {
  requestVersion: "1.1.0",
  casting: {
    kind: "calendar",
    inputMode: "manual_lunar",
    calendarPolicyId: "manual-lunar-v1",
    timeInput: {
      kind: "manual_lunar",
      lunarMonth: 1,
      lunarDay: 1,
      earthlyBranchIndex: 1,
      isLeapMonth: false,
    },
  },
  questionContext: {},
  displayPreferences: {
    language: "zh-CN",
    showTraditionalText: true,
    showSourceTrace: true,
    showCalculationTrace: true,
  },
};

const resolvedInput: ResultInput = {
  kind: "calendar",
  inputMode: "manual_lunar",
  timezone: null,
  localDateTime: null,
  lunarMonth: 1,
  lunarDay: 1,
  isLeapMonth: false,
  earthlyBranch: "zi",
  earthlyBranchIndex: 1,
  domainId: "general",
  stageId: null,
  questionFlags: [],
  privacy: {
    questionTextStored: false,
    questionTextIncludedInExport: false,
  },
};

const calendar: CalendarResult = {
  calendarPolicyId: "manual-lunar-v1",
  localDateTime: null,
  timezone: null,
  resolvedLunarDate: { year: null, month: 1, day: 1, isLeapMonth: false },
  earthlyBranch: "zi",
  earthlyBranchIndex: 1,
  boundaryDecision: {
    mode: "civil_midnight",
    appliedDayOffset: 0,
    manualInputBypass: true,
  },
  trace: [],
  warnings: [],
};

const calculation: CalculationResult = {
  algorithmId: "traditional-month-day-hour-v1",
  algorithmStatus: "FROZEN-PROVISIONAL",
  palaceOrder: ["da_an", "liu_lian", "su_xi", "chi_kou", "xiao_ji", "kong_wang"],
  monthIndex: 0,
  dayIndex: 0,
  hourIndex: 0,
  monthPalaceId: "da_an",
  dayPalaceId: "da_an",
  finalPalaceId: "da_an",
  trace: [
    { stage: "month", startPalaceId: "da_an", countValue: 1, offset: 0, resultIndex: 0, resultPalaceId: "da_an", formula: "stub" },
    { stage: "day", startPalaceId: "da_an", countValue: 1, offset: 0, resultIndex: 0, resultPalaceId: "da_an", formula: "stub" },
    { stage: "hour", startPalaceId: "da_an", countValue: 1, offset: 0, resultIndex: 0, resultPalaceId: "da_an", formula: "stub" },
  ],
};

const interpretation: InterpretationResult = {
  domainId: "general",
  stageId: null,
  certaintyMode: "symbolic-non-deterministic",
  sections: {
    neutral: [],
    domain: [],
    stage: [],
    actions: [],
    traditionalText: [],
    historicalContext: [],
    realityChecks: [],
    ethicsNotices: [],
  },
  fragmentIds: [],
  candidateClaimIds: [],
  trace: [],
};

const ethics: EthicsResult = {
  mode: "allow",
  evaluatedRuleIds: [],
  triggeredRuleIds: [],
  retainedClaimIds: [],
  suppressedClaims: [],
  retainedFragmentIds: [],
  blockedFragmentIds: [],
  forcedConclusionCodes: [],
  requiredNotices: [],
  requiredRealityActionCodes: [],
  contextCodes: [],
  allowedTopics: [],
  forbiddenActionTypes: [],
  preferredTerms: [],
  forbiddenTerms: [],
  stopPrimaryDivination: false,
  trace: [],
};

const provenance: Provenance = {
  knowledgeVersion: "stub",
  ruleVersion: "stub",
  schemaVersions: {},
  sourceIds: [],
  provisionalSourceIds: [],
  disputedFieldIds: [],
  calendarPolicyId: request.casting.kind === "calendar" ? request.casting.calendarPolicyId : null,
  algorithmId: calculation.algorithmId,
  fragmentIds: [],
  ethicsRuleIds: [],
};

const dependencies: DivinationDependencies = {
  calendar: {
    async resolve() {
      return {
        casting: {
          kind: "calendar",
          inputMode: "manual_lunar",
          calendarPolicyId: "manual-lunar-v1",
        },
        input: resolvedInput,
        calendar,
        calculationInput: { kind: "calendar", lunarMonth: 1, lunarDay: 1, earthlyBranchIndex: 1 },
      };
    },
  },
  calculation: { calculate: () => calculation },
  interpretation: { interpret: async () => interpretation },
  ethics: { evaluate: async () => ethics },
  provenance: { create: () => provenance },
};

describe("runDivination service boundary", () => {
  it("orchestrates injected modules without calculating a palace", async () => {
    const result = await runDivination(request, dependencies);

    expect(result.calculation).toBe(calculation);
    expect(result.ethics).toBe(ethics);
    expect(result.provenance).toBe(provenance);
  });
});
