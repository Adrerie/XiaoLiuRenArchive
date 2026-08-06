import { describe, expect, it, beforeEach, vi } from "vitest";
import type { DivinationRequest } from "../shared";
import { runLocalDivination } from "../app/divination-runtime";
import { serializeExportPayload } from "../app/result-export";

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}));
vi.mock("@capacitor/clipboard", () => ({
  Clipboard: { write: vi.fn() },
}));
vi.mock("@capacitor/filesystem", () => ({
  Directory: { Cache: "CACHE" },
  Encoding: { UTF8: "utf8" },
  Filesystem: { writeFile: vi.fn() },
}));
vi.mock("@capacitor/share", () => ({
  Share: { share: vi.fn() },
}));

import { Capacitor } from "@capacitor/core";
import { Clipboard } from "@capacitor/clipboard";
import { Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { copyExportJson, EXPORT_FILE_NAME, saveOrShareExportJson } from "./export-result";

const nativePlatform = vi.mocked(Capacitor.isNativePlatform);
const clipboardWrite = vi.mocked(Clipboard.write);
const fileWrite = vi.mocked(Filesystem.writeFile);
const share = vi.mocked(Share.share);

function request(): DivinationRequest {
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
  };
}

describe("platform export adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    nativePlatform.mockReturnValue(false);
    clipboardWrite.mockResolvedValue(undefined);
    fileWrite.mockResolvedValue({ uri: "file:///cache/xiaoliuren-result.json" });
    share.mockResolvedValue({});
  });

  it("uses the browser download path on Web", async () => {
    const click = vi.fn();
    const link = { click, download: "", href: "" };
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("document", { createElement: vi.fn(() => link) });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const result = await saveOrShareExportJson("{\"ok\":true}");

    expect(result.ok).toBe(true);
    expect(link.download).toBe("xiaoliuren-result.json");
    expect(click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("uses Capacitor Clipboard on Android", async () => {
    nativePlatform.mockReturnValue(true);

    const result = await copyExportJson("{\"local\":true}");

    expect(result.ok).toBe(true);
    expect(clipboardWrite).toHaveBeenCalledWith({ string: "{\"local\":true}" });
  });

  it("reports Android Share failure without claiming a successful share", async () => {
    nativePlatform.mockReturnValue(true);
    share.mockRejectedValue(new Error("cancelled"));

    const result = await saveOrShareExportJson("{\"local\":true}");

    expect(fileWrite).toHaveBeenCalledOnce();
    expect(fileWrite).toHaveBeenCalledWith(expect.objectContaining({
      path: EXPORT_FILE_NAME,
      data: "{\"local\":true}",
      directory: "CACHE",
      encoding: "utf8",
    }));
    expect(share).toHaveBeenCalledOnce();
    expect(result.ok).toBe(false);
    expect(result.message).toContain("系统分享未能打开");
  });

  it("keeps the default privacy fields when adapted output is prepared", async () => {
    const result = await runLocalDivination(request());
    const serialized = serializeExportPayload(result);

    expect(serialized).not.toContain("2024-02-10T12:00");
    expect(serialized).not.toContain("用户真实问题");
    expect(serialized).toContain('"questionTextIncludedInExport": false');
    expect(result.input.privacy.questionTextStored).toBe(false);
  });
});
