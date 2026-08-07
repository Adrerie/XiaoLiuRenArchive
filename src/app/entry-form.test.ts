import { describe, expect, it } from "vitest";
import {
  createInitialForm,
  formatLocalDateTime,
  formatTimeZoneWarning,
  normalizeTimeZone,
  refreshCurrentTime,
  selectCastingMode,
} from "./entry-form";

describe("entry form defaults and independent drafts", () => {
  const fixedNow = new Date("2026-08-06T15:18:00.000Z");

  it("uses the device-local current time without UTC string truncation", () => {
    const form = createInitialForm(fixedNow, "Asia/Shanghai");

    expect(form.castingMode).toBe("current_civil_time");
    expect(form.currentDateTime).toBe("2026-08-06T23:18");
    expect(form.currentTimezone).toBe("Asia/Shanghai");
    expect(form.specifiedDateTime).toBe(form.currentDateTime);
    expect(form.specifiedTimezone).toBe(form.currentTimezone);
    expect(formatLocalDateTime(fixedNow, "America/New_York")).toBe("2026-08-06T11:18");
  });

  it("falls back to UTC visibly when the runtime time zone is invalid", () => {
    const detection = normalizeTimeZone("Not/A-Timezone");
    const form = createInitialForm(fixedNow, "Not/A-Timezone");

    expect(detection).toEqual({ timeZone: "UTC", usedFallback: true });
    expect(form.currentTimezone).toBe("UTC");
    expect(form.currentTimezoneFallback).toBe(true);
    expect(formatTimeZoneWarning(detection)).toContain("回退 UTC");
  });

  it("refreshes only the current-time draft and preserves other modes", () => {
    const initial = createInitialForm(fixedNow, "Asia/Shanghai");
    const edited = {
      ...initial,
      specifiedDateTime: "2030-01-02T03:04",
      specifiedTimezone: "UTC",
      lunarMonth: "9",
      firstNumber: "8",
    };
    const refreshed = refreshCurrentTime(edited, new Date("2026-08-07T00:20:00.000Z"), "UTC");

    expect(refreshed.currentDateTime).not.toBe(edited.currentDateTime);
    expect(refreshed.specifiedDateTime).toBe("2030-01-02T03:04");
    expect(refreshed.specifiedTimezone).toBe("UTC");
    expect(refreshed.lunarMonth).toBe("9");
    expect(refreshed.firstNumber).toBe("8");
  });

  it("refreshes when current time is selected again and keeps other drafts", () => {
    const initial = createInitialForm(fixedNow, "Asia/Shanghai");
    const edited = { ...initial, castingMode: "three_number_variant" as const, thirdNumber: "9007199254740993123" };
    const refreshed = selectCastingMode(edited, "current_civil_time", new Date("2026-08-07T00:20:00.000Z"), "UTC");
    expect(refreshed.castingMode).toBe("current_civil_time");
    expect(refreshed.currentDateTime).toBe("2026-08-07T00:20");
    expect(refreshed.thirdNumber).toBe("9007199254740993123");

    const selectedAgain = selectCastingMode({ ...refreshed, currentDateTime: "2000-01-01T00:00" }, "current_civil_time", new Date("2026-08-07T01:20:00.000Z"), "UTC");
    expect(selectedAgain.currentDateTime).toBe("2026-08-07T01:20");
  });
});
