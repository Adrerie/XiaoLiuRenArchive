import { computeThreeNumberCasting, normalizeThreeNumber, normalizeThreeNumberInput } from "../core/three-number";
import { getCastingMethod, listStageOptions } from "../knowledge";
import { APP_VERSION } from "../app/app-version";
import type {
  CalculationResult,
  DivinationResult,
  PalaceId,
  ThreeNumberInput,
  ThreePalace,
} from "../shared";

export const ARCHIVE_SCHEMA_VERSION = "1.0.0" as const;
export const ARCHIVE_STORAGE_KEY = "xiaoliurenarchive.archive.v1" as const;

export interface ArchiveCalendarPath {
  readonly kind: "calendar";
  readonly monthPalaceId: PalaceId;
  readonly dayPalaceId: PalaceId;
  readonly hourPalaceId: PalaceId;
}

export interface ArchiveThreePalacePath {
  readonly kind: "three_palaces";
  readonly palaces: readonly [ThreePalace, ThreePalace, ThreePalace];
}

export type ArchivePath = ArchiveCalendarPath | ArchiveThreePalacePath;

export interface ArchiveRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly title: string | null;
  readonly methodId: string;
  readonly methodName: string;
  readonly domainId: string;
  readonly stageId: string | null;
  readonly stageLabel: string | null;
  readonly primaryPalaceId: PalaceId;
  readonly primaryPalaceOrdinal: 3 | null;
  readonly path: ArchivePath;
  readonly result: DivinationResult;
  readonly appVersion: string;
  readonly requestVersion: string;
  readonly resultVersion: string;
  readonly knowledgeVersion: string;
  readonly methodVersion: string;
  readonly migratedFrom: "r4" | "r5" | null;
}

export interface ArchiveCollection {
  readonly schemaVersion: typeof ARCHIVE_SCHEMA_VERSION;
  readonly records: readonly ArchiveRecord[];
}

export interface ArchiveImportReport {
  readonly importedCount: number;
  readonly migratedCount: number;
}

export interface ArchiveStorage {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem: (key: string) => void;
}

export class ArchiveError extends Error {
  readonly code: "ARCHIVE_READ_ERROR" | "ARCHIVE_WRITE_ERROR" | "ARCHIVE_IMPORT_ERROR" | "ARCHIVE_VERSION_ERROR";

  constructor(code: ArchiveError["code"], message: string) {
    super(message);
    this.name = "ArchiveError";
    this.code = code;
  }
}

interface JsonRecord {
  readonly [key: string]: unknown;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new ArchiveError("ARCHIVE_IMPORT_ERROR", `${label} 必须是非空字符串。`);
  return value;
}

function optionalStringField(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return stringField(value, label);
}

function palaceField(value: unknown, label: string): PalaceId {
  const palace = stringField(value, label);
  if (!["da_an", "liu_lian", "su_xi", "chi_kou", "xiao_ji", "kong_wang"].includes(palace)) {
    throw new ArchiveError("ARCHIVE_IMPORT_ERROR", `${label} 不是有效六宫。`);
  }
  return palace as PalaceId;
}

function isSupportedResult(value: unknown): value is DivinationResult {
  if (!isRecord(value) || value.resultVersion !== "1.3.0") return false;
  if (!isRecord(value.casting) || !isRecord(value.input) || !isRecord(value.calculation)) return false;
  if (!isRecord(value.interpretation) || !isRecord(value.interpretation.sections)) return false;
  if (!isRecord(value.ethics) || !isRecord(value.provenance)) return false;
  const sections = value.interpretation.sections;
  if (!Array.isArray(sections.relationshipCurrentState)
    || typeof value.calculation.algorithmId !== "string"
    || typeof value.calculation.finalPalaceId !== "string"
    || typeof value.provenance.methodId !== "string"
    || typeof value.provenance.methodVersion !== "string"
    || !Array.isArray(value.provenance.methodSourceIds)) return false;
  if (value.calculation.algorithmId === "three-number-sequential-count-v1") {
    if (!Array.isArray(value.calculation.threePalaces)
      || value.calculation.threePalaces.length !== 3
      || value.calculation.primaryPalaceOrdinal !== 3
      || value.calculation.primaryPalaceId !== value.calculation.threePalaces[2]?.palaceId) return false;
    return value.calculation.threePalaces.every((item, index) => {
      if (!isRecord(item) || item.ordinal !== index + 1 || typeof item.rawNumber !== "string") return false;
      try {
        normalizeThreeNumber(item.rawNumber, item.ordinal === 1 ? "first" : item.ordinal === 2 ? "second" : "third");
        palaceField(item.startPalaceId, "threePalaces.startPalaceId");
        palaceField(item.palaceId, "threePalaces.palaceId");
      } catch {
        return false;
      }
      return typeof item.normalizedOffset === "number"
        && Number.isInteger(item.normalizedOffset)
        && item.normalizedOffset >= 0
        && item.normalizedOffset <= 5;
    });
  }
  return value.calculation.algorithmId === "traditional-month-day-hour-v1"
    && value.provenance.methodId === "traditional-month-day-hour-v1";
}

function normalizedLegacyNumbers(value: JsonRecord): ThreeNumberInput {
  const first = value.first;
  const second = value.second;
  const third = value.third;
  const asText = (item: unknown, label: "first" | "second" | "third"): string => {
    if (typeof item === "number" && Number.isSafeInteger(item) && item > 0) return String(item);
    if (typeof item === "string") return item;
    throw new ArchiveError("ARCHIVE_IMPORT_ERROR", `R5 三数 ${label} 无法安全迁移。`);
  };
  return normalizeThreeNumberInput({
    kind: "three_numbers",
    first: asText(first, "first"),
    second: asText(second, "second"),
    third: asText(third, "third"),
  });
}

function migrateLegacyResult(value: unknown): DivinationResult {
  if (!isRecord(value) || (value.resultVersion !== "1.2.0" && value.resultVersion !== "1.1.0")) {
    throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "只支持 R4/R5 结果或 R6 课例册数据。\n");
  }
  const casting = isRecord(value.casting) ? value.casting : null;
  const input = isRecord(value.input) ? value.input : null;
  const interpretation = isRecord(value.interpretation) ? value.interpretation : null;
  const sections = interpretation && isRecord(interpretation.sections) ? interpretation.sections : null;
  const provenance = isRecord(value.provenance) ? value.provenance : null;
  if (!casting || !input || !interpretation || !sections || !provenance) {
    throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "旧版结果缺少必要结构，已拒绝导入。");
  }

  const normalizedCasting = casting.kind === "three_numbers" && isRecord(casting.input)
    ? normalizedLegacyNumbers(casting.input)
    : null;
  const normalizedInput = input.kind === "three_numbers" && isRecord(input.numbers)
    ? normalizedLegacyNumbers(input.numbers)
    : null;
  const legacyCalculation = isRecord(value.calculation) ? value.calculation : null;
  const threeNumbers = normalizedCasting ?? normalizedInput;
  const upgradedCalculation = threeNumbers
    ? computeThreeNumberCasting(threeNumbers)
    : legacyCalculation;
  if (!upgradedCalculation || !isRecord(upgradedCalculation)) {
    throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "旧版计算结果缺失，已拒绝导入。");
  }
  const upgradedCasting = normalizedCasting
    ? { ...casting, input: normalizedCasting }
    : casting;
  const upgradedInput = normalizedInput
    ? { ...input, numbers: normalizedInput }
    : input;
  const methodId = typeof provenance.algorithmId === "string"
    ? provenance.algorithmId
    : normalizedCasting
      ? "three-number-sequential-count-v1"
      : "traditional-month-day-hour-v1";
  const method = getCastingMethod(methodId);
  const upgraded = {
    ...value,
    resultVersion: "1.3.0",
    casting: upgradedCasting,
    input: upgradedInput,
    calculation: upgradedCalculation,
    interpretation: {
      ...interpretation,
      sections: { ...sections, relationshipCurrentState: sections.relationshipCurrentState ?? [] },
    },
    provenance: {
      ...provenance,
      methodId,
      methodVersion: method.version,
      methodSourceIds: method.sourceIds,
    },
  };
  if (!isSupportedResult(upgraded)) throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "旧版结果无法升级为 R6 结果合同。");
  return upgraded;
}

function parseImportedResult(value: unknown): DivinationResult {
  if (isSupportedResult(value)) return value;
  return migrateLegacyResult(value);
}

function createId(): string {
  return `archive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPath(result: DivinationResult): ArchivePath {
  if (result.calculation.algorithmId === "three-number-sequential-count-v1") {
    return { kind: "three_palaces", palaces: result.calculation.threePalaces };
  }
  return {
    kind: "calendar",
    monthPalaceId: result.calculation.monthPalaceId,
    dayPalaceId: result.calculation.dayPalaceId,
    hourPalaceId: result.calculation.finalPalaceId,
  };
}

function createRecord(result: DivinationResult, title: string | null, migratedFrom: ArchiveRecord["migratedFrom"]): ArchiveRecord {
  const method = getCastingMethod(result.provenance.methodId);
  const stageLabel = result.interpretation.stageId === null
    ? null
    : listStageOptions(result.interpretation.domainId).find((stage) => stage.id === result.interpretation.stageId)?.label ?? null;
  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    title,
    methodId: method.id,
    methodName: method.name,
    domainId: result.interpretation.domainId,
    stageId: result.interpretation.stageId,
    stageLabel,
    primaryPalaceId: result.calculation.finalPalaceId,
    primaryPalaceOrdinal: result.calculation.algorithmId === "three-number-sequential-count-v1" ? 3 : null,
    path: createPath(result),
    result,
    appVersion: APP_VERSION,
    requestVersion: result.provenance.schemaVersions.request,
    resultVersion: result.resultVersion,
    knowledgeVersion: result.provenance.knowledgeVersion,
    methodVersion: method.version,
    migratedFrom,
  };
}

function parsePath(value: unknown): ArchivePath {
  if (!isRecord(value)) throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "课例路径必须是对象。\n");
  if (value.kind === "three_palaces" && Array.isArray(value.palaces) && value.palaces.length === 3) {
    const parsePalace = (item: unknown): ThreePalace => {
      if (!isRecord(item)) throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "三宫路径节点格式无效。\n");
      const ordinal = item.ordinal;
      if (ordinal !== 1 && ordinal !== 2 && ordinal !== 3) throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "三宫序号无效。\n");
      const rawNumber = stringField(item.rawNumber, "path.rawNumber");
      const normalizedOffset = item.normalizedOffset;
      if (typeof normalizedOffset !== "number" || !Number.isInteger(normalizedOffset) || normalizedOffset < 0 || normalizedOffset > 5) {
        throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "三宫余数无效。\n");
      }
      return {
        ordinal,
        rawNumber,
        startPalaceId: palaceField(item.startPalaceId, "path.startPalaceId"),
        normalizedOffset: normalizedOffset as ThreePalace["normalizedOffset"],
        palaceId: palaceField(item.palaceId, "path.palaceId"),
      };
    };
    const parsed = value.palaces.map(parsePalace);
    return { kind: "three_palaces", palaces: [parsed[0], parsed[1], parsed[2]] };
  }
  if (value.kind === "calendar") {
    return {
      kind: "calendar",
      monthPalaceId: palaceField(value.monthPalaceId, "path.monthPalaceId"),
      dayPalaceId: palaceField(value.dayPalaceId, "path.dayPalaceId"),
      hourPalaceId: palaceField(value.hourPalaceId, "path.hourPalaceId"),
    };
  }
  throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "课例路径格式无效。\n");
}

function parseStoredRecord(value: unknown): ArchiveRecord {
  if (!isRecord(value)) throw new ArchiveError("ARCHIVE_IMPORT_ERROR", "课例记录必须是对象。\n");
  return {
    id: stringField(value.id, "record.id"),
    createdAt: stringField(value.createdAt, "record.createdAt"),
    title: optionalStringField(value.title, "record.title"),
    methodId: stringField(value.methodId, "record.methodId"),
    methodName: stringField(value.methodName, "record.methodName"),
    domainId: stringField(value.domainId, "record.domainId"),
    stageId: optionalStringField(value.stageId, "record.stageId"),
    stageLabel: optionalStringField(value.stageLabel, "record.stageLabel"),
    primaryPalaceId: palaceField(value.primaryPalaceId, "record.primaryPalaceId"),
    primaryPalaceOrdinal: value.primaryPalaceOrdinal === null ? null : 3,
    path: parsePath(value.path),
    result: parseImportedResult(value.result),
    appVersion: stringField(value.appVersion, "record.appVersion"),
    requestVersion: stringField(value.requestVersion, "record.requestVersion"),
    resultVersion: stringField(value.resultVersion, "record.resultVersion"),
    knowledgeVersion: stringField(value.knowledgeVersion, "record.knowledgeVersion"),
    methodVersion: stringField(value.methodVersion, "record.methodVersion"),
    migratedFrom: value.migratedFrom === "r4" || value.migratedFrom === "r5" ? value.migratedFrom : null,
  };
}

function parseCollection(value: unknown): readonly ArchiveRecord[] {
  if (!isRecord(value) || value.schemaVersion !== ARCHIVE_SCHEMA_VERSION || !Array.isArray(value.records)) {
    throw new ArchiveError("ARCHIVE_VERSION_ERROR", "课例册版本无法识别，未来版本不会被自动覆盖。\n");
  }
  return value.records.map(parseStoredRecord);
}

function legacyVersion(value: unknown): ArchiveRecord["migratedFrom"] {
  if (!isRecord(value) || typeof value.resultVersion !== "string") return null;
  if (value.resultVersion === "1.2.0") return "r5";
  if (value.resultVersion === "1.1.0") return "r4";
  return null;
}

function parseImportRecord(value: unknown): ArchiveRecord {
  const rawRecord = isRecord(value) ? value : null;
  const rawResult = rawRecord?.result;
  const migratedFrom = legacyVersion(rawResult);
  try {
    const parsed = parseStoredRecord(value);
    return migratedFrom === null || parsed.migratedFrom !== null
      ? parsed
      : { ...parsed, migratedFrom };
  } catch (error) {
    if (rawResult === undefined) throw error;
    const result = parseImportedResult(rawResult);
    const title = optionalStringField(rawRecord?.title, "record.title");
    return createRecord(result, title, migratedFrom);
  }
}

function parseImportCollection(value: unknown): { readonly records: readonly ArchiveRecord[]; readonly migratedCount: number } {
  if (!isRecord(value) || value.schemaVersion !== ARCHIVE_SCHEMA_VERSION || !Array.isArray(value.records)) {
    throw new ArchiveError("ARCHIVE_VERSION_ERROR", "课例册版本无法识别，未来版本不会被自动覆盖。\n");
  }
  const records = value.records.map(parseImportRecord);
  return { records, migratedCount: records.filter((record) => record.migratedFrom !== null).length };
}

function createMemoryStorage(): ArchiveStorage {
  let value: string | null = null;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => { value = nextValue; },
    removeItem: () => { value = null; },
  };
}

function defaultStorage(): ArchiveStorage {
  try {
    if (typeof globalThis.localStorage !== "undefined") return globalThis.localStorage;
  } catch {
    // Some WebViews deny storage access; the in-memory fallback keeps the app usable for this session.
  }
  return createMemoryStorage();
}

export function createArchiveStore(storage: ArchiveStorage = defaultStorage()): ArchiveStore {
  const read = (): readonly ArchiveRecord[] => {
    const raw = storage.getItem(ARCHIVE_STORAGE_KEY);
    if (raw === null) return [];
    try {
      return parseCollection(JSON.parse(raw));
    } catch (error) {
      if (error instanceof ArchiveError) throw error;
      throw new ArchiveError("ARCHIVE_READ_ERROR", "课例册数据损坏，已拒绝读取。\n");
    }
  };
  const write = (records: readonly ArchiveRecord[]): void => {
    try {
      const collection: ArchiveCollection = { schemaVersion: ARCHIVE_SCHEMA_VERSION, records };
      storage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(collection));
    } catch {
      throw new ArchiveError("ARCHIVE_WRITE_ERROR", "课例册保存失败，可能是设备存储空间不足。\n");
    }
  };
  const uniqueId = (records: readonly ArchiveRecord[]): string => {
    let id = createId();
    while (records.some((record) => record.id === id)) id = createId();
    return id;
  };
  return {
    list: () => read(),
    save: (result, title = null) => {
      const records = [...read()];
      const record = { ...createRecord(result, title?.trim() || null, null), id: uniqueId(records) };
      write([record, ...records]);
      return record;
    },
    updateTitle: (id, title) => {
      const records = read();
      const next = records.map((record) => record.id === id ? { ...record, title: title.trim() || null } : record);
      if (!records.some((record) => record.id === id)) throw new ArchiveError("ARCHIVE_WRITE_ERROR", "找不到要修改的课例。\n");
      write(next);
    },
    remove: (id) => {
      const records = read();
      write(records.filter((record) => record.id !== id));
    },
    clear: () => write([]),
    exportJson: () => JSON.stringify({ schemaVersion: ARCHIVE_SCHEMA_VERSION, records: read() } satisfies ArchiveCollection, null, 2),
    importJson: (payload) => {
      const current = [...read()];
      const directResult = isRecord(payload) && payload.resultVersion !== undefined;
      const collection = directResult ? null : parseImportCollection(payload);
      const imported = directResult
        ? [createRecord(parseImportedResult(payload), null, legacyVersion(payload))]
        : collection?.records ?? [];
      const normalized = imported.map((record) => ({ ...record, id: current.some((item) => item.id === record.id) ? createId() : record.id }));
      write([...normalized, ...current]);
      return { importedCount: normalized.length, migratedCount: normalized.filter((record) => record.migratedFrom !== null).length };
    },
  };
}

export interface ArchiveStore {
  readonly list: () => readonly ArchiveRecord[];
  readonly save: (result: DivinationResult, title?: string | null) => ArchiveRecord;
  readonly updateTitle: (id: string, title: string) => void;
  readonly remove: (id: string) => void;
  readonly clear: () => void;
  readonly exportJson: () => string;
  readonly importJson: (payload: unknown) => ArchiveImportReport;
}
