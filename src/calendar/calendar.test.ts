import { describe, expect, it } from "vitest";
import {
  CALENDAR_POLICIES,
  fromGregorian,
  isCalendarNormalizationError,
} from "./adapter";

describe("calendar policy boundary", () => {
  it("keeps the stable civil conversion path available", () => {
    const result = fromGregorian({
      localDateTime: "2024-02-10T12:00",
      timezone: "Asia/Shanghai",
      fold: null,
      calendarPolicyId: "civil-midnight-reuse-leap-month",
    });

    expect(result.lunarMonth).toBe(1);
    expect(result.lunarDay).toBe(1);
    expect(result.earthlyBranch).toBe("午");
    expect(result.calendarPolicyId).toBe("civil-midnight-reuse-leap-month");
  });

  it("exposes both policies and differentiates the 23:00 boundary", () => {
    expect(CALENDAR_POLICIES.map((policy) => policy.id)).toEqual([
      "civil-midnight-reuse-leap-month",
      "zi-hour-23-reuse-leap-month",
      "manual-lunar-input-v1",
    ]);
    const civil = fromGregorian({
      localDateTime: "2024-02-09T23:00",
      timezone: "Asia/Shanghai",
      fold: null,
      calendarPolicyId: "civil-midnight-reuse-leap-month",
    });
    const ziHour = fromGregorian({
      localDateTime: "2024-02-09T23:00",
      timezone: "Asia/Shanghai",
      fold: null,
      calendarPolicyId: "zi-hour-23-reuse-leap-month",
    });

    expect({ civilMonth: civil.lunarMonth, civilDay: civil.lunarDay, civilLeap: civil.isLeapMonth })
      .not.toEqual({ civilMonth: ziHour.lunarMonth, civilDay: ziHour.lunarDay, civilLeap: ziHour.isLeapMonth });
  });

  it("accepts both folds for a repeated local time", () => {
    const input = { localDateTime: "2024-11-03T01:30", timezone: "America/New_York", calendarPolicyId: "civil-midnight-reuse-leap-month" as const };
    const earlier = fromGregorian({ ...input, fold: 0 });
    const later = fromGregorian({ ...input, fold: 1 });

    expect(earlier.localDateTime).toBe(later.localDateTime);
    expect(earlier.calendarPolicyId).toBe(input.calendarPolicyId);
  });

  it("returns a structured error for a nonexistent local time", () => {
    try {
      fromGregorian({
        localDateTime: "2024-03-10T02:30",
        timezone: "America/New_York",
        fold: null,
        calendarPolicyId: "civil-midnight-reuse-leap-month",
      });
      throw new Error("expected a nonexistent-local-time error");
    } catch (error) {
      expect(isCalendarNormalizationError(error)).toBe(true);
      if (isCalendarNormalizationError(error)) {
        expect(error.code).toBe("CALENDAR_LOCAL_TIME_NONEXISTENT");
        expect(error.suggestedAction).toContain("another local time");
      }
    }
  });
});
