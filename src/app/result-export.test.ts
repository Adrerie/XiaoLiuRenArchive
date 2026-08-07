import { describe, expect, it } from "vitest";
import type { DivinationRequest } from "../shared";
import { runLocalDivination } from "./divination-runtime";
import { createExportPayload, serializeExportPayload } from "./result-export";

function request(overrides: Partial<DivinationRequest> = {}): DivinationRequest {
  return {
    requestVersion: "1.1.0",
    casting: {
      kind: "calendar",
      inputMode: "civil_datetime",
      calendarPolicyId: "civil-midnight-reuse-leap-month",
      timeInput: {
        kind: "civil_datetime",
        localDateTime: "2024-02-10T12:00",
        timezone: "Asia/Shanghai",
        fold: null,
      },
    },
    questionContext: {
      domainId: "relationship",
      stageId: "seeking",
      flags: [],
      facts: { explicitRefusalExists: false, immediateSafetyRisk: false },
    },
    displayPreferences: { language: "zh-CN", showTraditionalText: true, showSourceTrace: true, showCalculationTrace: true },
    ...overrides,
  };
}

describe("local JSON export", () => {
  it("removes exact time and question fields by default while preserving trace and provenance", async () => {
    const result = await runLocalDivination(request());
    const exported = createExportPayload(result);
    const serialized = serializeExportPayload(result);

    expect(exported.input.kind === "calendar" ? exported.input.localDateTime : "unexpected").toBeNull();
    expect(exported.calendar?.localDateTime).toBeNull();
    expect(exported.input.privacy.questionTextIncludedInExport).toBe(false);
    expect(exported.calculation.trace).toEqual(result.calculation.trace);
    expect(exported.provenance).toEqual(result.provenance);
    expect(serialized).not.toContain("2024-02-10T12:00");
    expect(serialized).not.toContain("\"questionText\":");
  });

  it("includes exact time only when explicitly selected", async () => {
    const result = await runLocalDivination(request());
    const exported = createExportPayload(result, { includePreciseTime: true });

    expect(exported.input.kind === "calendar" ? exported.input.localDateTime : "unexpected").toBe("2024-02-10T12:00:00");
    expect(exported.calendar?.localDateTime).toBe("2024-02-10T12:00:00");
    expect(exported.input.privacy.questionTextIncludedInExport).toBe(false);
  });

  it("preserves the adapter boundary offset and trace in local JSON", async () => {
    const result = await runLocalDivination(request({
      casting: {
        kind: "calendar",
        inputMode: "civil_datetime",
        calendarPolicyId: "zi-hour-23-reuse-leap-month",
        timeInput: {
          kind: "civil_datetime",
          localDateTime: "2024-02-09T23:00",
          timezone: "Asia/Shanghai",
          fold: null,
        },
      },
    }));
    const exported = createExportPayload(result);
    if (exported.calendar === null || result.calendar === null) throw new Error("Calendar result missing");
    const boundaryTrace = exported.calendar.trace.find((entry) => entry.stage === "calendar-boundary");

    expect(exported.calendar.boundaryDecision.appliedDayOffset).toBe(1);
    expect(boundaryTrace).toMatchObject({
      appliedDayOffset: 1,
      inputLocalDateTime: null,
      lunarConversionLocalDateTime: null,
    });
    expect(exported.calendar.boundaryDecision).toEqual(result.calendar.boundaryDecision);
    expect(exported.calendar.trace.map((entry) => entry.stage)).toEqual(result.calendar.trace.map((entry) => entry.stage));

    const precise = createExportPayload(result, { includePreciseTime: true });
    expect(precise.calendar?.trace).toEqual(result.calendar.trace);
  });

  it("exports three-number results without a calendar section", async () => {
    const result = await runLocalDivination(request({
      casting: { kind: "three_numbers", input: { kind: "three_numbers", first: 3, second: 5, third: 5 } },
    }));
    const exported = createExportPayload(result, { includePreciseTime: true });

    expect(exported.calendar).toBeNull();
    expect(exported.input.kind).toBe("three_numbers");
    expect(exported.provenance.calendarPolicyId).toBeNull();
    expect(JSON.stringify(exported)).not.toContain("lunarMonth");
  });

  it.each([
    ["hard-block", { domainId: "health", stageId: null, flags: [], facts: { explicitRefusalExists: false, immediateSafetyRisk: false } }],
    ["hard-stop", { domainId: "travel_mobility", stageId: null, flags: ["missing_person"], facts: { explicitRefusalExists: false, immediateSafetyRisk: true } }],
  ] as const)("exports %s results locally", async (_label, questionContext) => {
    const result = await runLocalDivination(request({ questionContext }));
    const exported = createExportPayload(result);

    expect(exported.ethics.mode).toBe(result.ethics.mode);
    expect(exported.ethics.requiredRealityActionCodes).toEqual(result.ethics.requiredRealityActionCodes);
    expect(exported.provenance.knowledgeVersion).toBe(result.provenance.knowledgeVersion);
    expect(exported.provenance.sourceIds.length).toBeGreaterThan(0);
  });
});
