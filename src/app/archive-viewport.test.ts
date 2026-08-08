import { describe, expect, it } from "vitest";
import { shouldHandleArchiveBack, shouldOpenArchiveMobileDetail } from "./archive-viewport";

describe("archive viewport navigation", () => {
  it("opens mobile detail only in compact viewports", () => {
    expect(shouldOpenArchiveMobileDetail(true)).toBe(true);
    expect(shouldOpenArchiveMobileDetail(false)).toBe(false);
  });

  it("handles Android Back only for an open compact archive detail", () => {
    expect(shouldHandleArchiveBack("archive", true, true)).toBe(true);
    expect(shouldHandleArchiveBack("archive", false, true)).toBe(false);
    expect(shouldHandleArchiveBack("divination", true, true)).toBe(false);
    expect(shouldHandleArchiveBack("archive", true, false)).toBe(false);
  });
});
