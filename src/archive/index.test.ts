import { describe, expect, it } from "vitest";
import { runLocalDivination } from "../app/divination-runtime";
import type { DivinationRequest } from "../shared";
import { ArchiveError, createArchiveStore, type ArchiveStorage } from "./index";

function createStorage(persistent = true): ArchiveStorage {
  let value: string | null = null;
  return {
    persistent,
    getItem: () => value,
    setItem: (_key, nextValue) => { value = nextValue; },
    removeItem: () => { value = null; },
  };
}

function request(): DivinationRequest {
  return {
    requestVersion: "1.2.0",
    casting: { kind: "three_numbers", input: { kind: "three_numbers", first: "3", second: "5", third: "5" } },
    questionContext: { domainId: "relationship", stageId: "seeking", flags: [], facts: {} },
    displayPreferences: { language: "zh-CN", showTraditionalText: true, showSourceTrace: true, showCalculationTrace: true },
  };
}

describe("local casebook archive", () => {
  it("saves, edits, exports, imports and deletes local records", async () => {
    const result = await runLocalDivination(request());
    const firstStore = createArchiveStore(createStorage());
    const saved = firstStore.save(result, "第一次记录");

    expect(firstStore.list()).toHaveLength(1);
    expect(saved.primaryPalaceId).toBe("xiao_ji");
    expect(saved.path.kind).toBe("three_palaces");
    if (saved.path.kind === "three_palaces") {
      expect(saved.path.palaces.map((palace) => palace.palaceId)).toEqual(["su_xi", "da_an", "xiao_ji"]);
    }

    firstStore.updateTitle(saved.id, "  已改标题  ");
    expect(firstStore.list()[0]?.title).toBe("已改标题");

    const secondStore = createArchiveStore(createStorage());
    const report = secondStore.importJson(JSON.parse(firstStore.exportJson()) as unknown);
    expect(report).toEqual({ importedCount: 1, migratedCount: 0 });
    expect(secondStore.list()[0]?.result.calculation.finalPalaceId).toBe("xiao_ji");

    secondStore.remove(saved.id);
    expect(secondStore.list()).toHaveLength(0);
    firstStore.clear();
    expect(firstStore.list()).toHaveLength(0);
  });

  it("migrates an R5 safe-integer three-number result without using numeric defaults", async () => {
    const result = await runLocalDivination(request());
    const legacy = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
    const legacyCasting = legacy.casting as Record<string, unknown>;
    const legacyInput = legacy.input as Record<string, unknown>;
    const legacySections = (legacy.interpretation as Record<string, unknown>).sections as Record<string, unknown>;
    legacy.resultVersion = "1.2.0";
    legacyCasting.input = { kind: "three_numbers", first: 3, second: 5, third: 5 };
    legacyInput.numbers = { kind: "three_numbers", first: 3, second: 5, third: 5 };
    delete legacySections.relationshipCurrentState;

    const store = createArchiveStore(createStorage());
    const report = store.importJson(legacy);
    const imported = store.list()[0];

    expect(report.migratedCount).toBe(1);
    expect(imported?.migratedFrom).toBe("r5");
    expect(imported?.result.casting.kind === "three_numbers" ? imported.result.casting.input : null).toEqual({
      kind: "three_numbers",
      first: "3",
      second: "5",
      third: "5",
    });
    expect(imported?.result.calculation.algorithmId === "three-number-sequential-count-v1"
      ? imported.result.calculation.threePalaces[2].palaceId
      : null).toBe("xiao_ji");
  });

  it("migrates a real R4 traditional result without requiring top-level casting", async () => {
    const result = await runLocalDivination({
      requestVersion: "1.2.0",
      casting: {
        kind: "calendar",
        inputMode: "manual_lunar",
        calendarPolicyId: "manual-lunar-input-v1",
        timeInput: { kind: "manual_lunar", lunarMonth: 3, lunarDay: 5, earthlyBranchIndex: 5, isLeapMonth: false },
      },
      questionContext: { domainId: "relationship", stageId: "seeking", flags: [], facts: {} },
      displayPreferences: { language: "zh-CN", showTraditionalText: true, showSourceTrace: true, showCalculationTrace: true },
    });
    const legacy = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
    const currentInput = legacy.input as Record<string, unknown>;
    const legacySections = (legacy.interpretation as Record<string, unknown>).sections as Record<string, unknown>;
    const legacyProvenance = legacy.provenance as Record<string, unknown>;
    legacy.resultVersion = "1.1.0";
    delete legacy.casting;
    legacy.input = {
      inputMode: currentInput.inputMode,
      timezone: currentInput.timezone,
      localDateTime: currentInput.localDateTime,
      lunarMonth: currentInput.lunarMonth,
      lunarDay: currentInput.lunarDay,
      isLeapMonth: currentInput.isLeapMonth,
      earthlyBranch: currentInput.earthlyBranch,
      earthlyBranchIndex: currentInput.earthlyBranchIndex,
      domainId: currentInput.domainId,
      stageId: currentInput.stageId,
      questionFlags: currentInput.questionFlags,
      privacy: currentInput.privacy,
    };
    delete legacySections.relationshipCurrentState;
    delete legacyProvenance.methodId;
    delete legacyProvenance.methodVersion;
    delete legacyProvenance.methodSourceIds;

    const store = createArchiveStore(createStorage());
    const report = store.importJson(legacy);
    const imported = store.list()[0];

    expect(report).toEqual({ importedCount: 1, migratedCount: 1 });
    expect(imported?.migratedFrom).toBe("r4");
    expect(imported?.result.resultVersion).toBe("1.3.0");
    expect(imported?.result.casting.kind).toBe("calendar");
    expect(imported?.result.calculation.finalPalaceId).toBe(result.calculation.finalPalaceId);
    expect(imported?.path).toEqual({
      kind: "calendar",
      monthPalaceId: result.calculation.monthPalaceId,
      dayPalaceId: result.calculation.dayPalaceId,
      hourPalaceId: result.calculation.finalPalaceId,
    });
  });

  it("fails closed when wrapper metadata disagrees with the inner result", async () => {
    const result = await runLocalDivination(request());
    const sourceStore = createArchiveStore(createStorage());
    sourceStore.save(result);
    const payload = JSON.parse(sourceStore.exportJson()) as { records: Array<Record<string, unknown>> };
    payload.records[0].primaryPalaceOrdinal = 2;

    const targetStore = createArchiveStore(createStorage());
    expect(() => targetStore.importJson(payload)).toThrow(ArchiveError);
    expect(targetStore.list()).toEqual([]);
  });

  it("rejects duplicate IDs inside one import batch without partial writes", async () => {
    const result = await runLocalDivination(request());
    const sourceStore = createArchiveStore(createStorage());
    sourceStore.save(result, "批量记录");
    const payload = JSON.parse(sourceStore.exportJson()) as { records: Array<Record<string, unknown>>; schemaVersion: string };
    payload.records.push({ ...payload.records[0] });

    const targetStore = createArchiveStore(createStorage());
    expect(() => targetStore.importJson(payload)).toThrow(/重复课例 ID/);
    expect(targetStore.list()).toEqual([]);
  });

  it("rejects an existing ID without rewriting the current batch", async () => {
    const result = await runLocalDivination(request());
    const sourceStore = createArchiveStore(createStorage());
    sourceStore.save(result, "已有记录");
    const payload = JSON.parse(sourceStore.exportJson()) as { records: Array<Record<string, unknown>>; schemaVersion: string };

    const targetStore = createArchiveStore(createStorage());
    targetStore.importJson(payload);
    const before = targetStore.list();
    expect(() => targetStore.importJson(payload)).toThrow(/现有记录/);
    expect(targetStore.list()).toEqual(before);
  });

  it("does not claim local persistence when storage is unavailable", async () => {
    const store = createArchiveStore(createStorage(false));
    const result = await runLocalDivination(request());

    expect(store.capability.available).toBe(false);
    expect(() => store.save(result)).toThrowError(ArchiveError);
    expect(store.capability.message).toContain("不能可靠持久化");
  });

  it("rejects future archive versions without overwriting existing data", () => {
    const storage = createStorage();
    const store = createArchiveStore(storage);
    expect(() => store.importJson({ schemaVersion: "9.0.0", records: [] })).toThrow(ArchiveError);
    expect(store.list()).toEqual([]);
  });
});
