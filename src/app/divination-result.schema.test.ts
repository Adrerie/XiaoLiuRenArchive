import resultSchema from "../../knowledge/divination-result.schema.json";
import { describe, expect, it } from "vitest";
import { runLocalDivination } from "./divination-runtime";
import type { DivinationRequest } from "../shared";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown, path: string): JsonRecord {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  return value;
}

function schemaArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value;
}

function resolveReference(reference: string): unknown {
  if (!reference.startsWith("#/")) throw new Error(`Unsupported schema reference: ${reference}`);
  let current: unknown = resultSchema;
  for (const segment of reference.slice(2).split("/")) {
    const currentRecord = record(current, `schema reference ${reference}`);
    const key = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!(key in currentRecord)) throw new Error(`Missing schema reference segment: ${key}`);
    current = currentRecord[key];
  }
  return current;
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number" && Number.isInteger(value)) return "integer";
  return typeof value;
}

function assertSchemaValue(value: unknown, schemaValue: unknown, path = "result"): void {
  const schema = record(schemaValue, `${path} schema`);
  if (typeof schema.$ref === "string") {
    assertSchemaValue(value, resolveReference(schema.$ref), path);
    return;
  }

  const allOf = schema.allOf === undefined ? [] : schemaArray(schema.allOf, `${path}.allOf`);
  for (const item of allOf) assertSchemaValue(value, item, path);
  if ("const" in schema && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    throw new Error(`${path} does not match const`);
  }
  const enumValues = schema.enum === undefined ? [] : schemaArray(schema.enum, `${path}.enum`);
  if (enumValues.length > 0 && !enumValues.some((item) => JSON.stringify(item) === JSON.stringify(value))) {
    throw new Error(`${path} does not match enum`);
  }

  if (typeof schema.type === "string") {
    const actualType = valueType(value);
    if (actualType !== schema.type && !(schema.type === "number" && actualType === "integer")) {
      throw new Error(`${path} expected ${schema.type}, got ${actualType}`);
    }
  } else if (schema.type !== undefined) {
    const types = schemaArray(schema.type, `${path}.type`).filter((item): item is string => typeof item === "string");
    const actualType = valueType(value);
    if (!types.includes(actualType) && !(types.includes("number") && actualType === "integer")) {
      throw new Error(`${path} expected one of ${types.join(", ")}, got ${actualType}`);
    }
  }

  if (typeof value === "string") {
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value)) {
      throw new Error(`${path} does not match pattern`);
    }
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      throw new Error(`${path} is shorter than minLength`);
    }
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) throw new Error(`${path} is below minimum`);
    if (typeof schema.maximum === "number" && value > schema.maximum) throw new Error(`${path} is above maximum`);
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) throw new Error(`${path} is shorter than minItems`);
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) throw new Error(`${path} is longer than maxItems`);
    if (schema.uniqueItems === true) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) throw new Error(`${path} has duplicate items`);
    }
    const prefixItems = schema.prefixItems === undefined ? [] : schemaArray(schema.prefixItems, `${path}.prefixItems`);
    prefixItems.forEach((item, index) => {
      if (index < value.length) assertSchemaValue(value[index], item, `${path}[${index}]`);
    });
    if (schema.items === false && value.length > prefixItems.length) throw new Error(`${path} has unexpected items`);
    if (isRecord(schema.items)) {
      value.slice(prefixItems.length).forEach((item, index) => assertSchemaValue(item, schema.items, `${path}[${index + prefixItems.length}]`));
    }
  }

  if (isRecord(value)) {
    const properties = isRecord(schema.properties) ? schema.properties : {};
    const requiredValues = schema.required === undefined ? [] : schemaArray(schema.required, `${path}.required`);
    const required = requiredValues.filter((item): item is string => typeof item === "string");
    for (const key of required) if (!(key in value)) throw new Error(`${path} is missing ${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (key in properties) {
        assertSchemaValue(item, properties[key], `${path}.${key}`);
      } else if (schema.additionalProperties === false) {
        throw new Error(`${path}.${key} is not declared by the schema`);
      } else if (isRecord(schema.additionalProperties)) {
        assertSchemaValue(item, schema.additionalProperties, `${path}.${key}`);
      }
    }
  }
}

function request(overrides: Partial<DivinationRequest> = {}): DivinationRequest {
  return {
    requestVersion: "1.0.0",
    inputMode: "manual_lunar",
    calendarPolicyId: "manual-lunar-input-v1",
    timeInput: { kind: "manual_lunar", lunarMonth: 3, lunarDay: 5, earthlyBranchIndex: 5, isLeapMonth: false },
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

describe("serialized divination result schema", () => {
  it.each([
    ["manual", request()],
    ["consent_block", request({ questionContext: { domainId: "relationship", stageId: "seeking", flags: [], facts: { explicitRefusalExists: true, immediateSafetyRisk: false } } })],
    ["hard_block", request({ questionContext: { domainId: "health", stageId: null, flags: [], facts: { explicitRefusalExists: false, immediateSafetyRisk: false } } })],
    ["hard_stop", request({ questionContext: { domainId: "travel_mobility", stageId: null, flags: ["missing_person"], facts: { explicitRefusalExists: false, immediateSafetyRisk: true } } })],
  ] as const)("serializes a %s result without undeclared fields", async (_name, input) => {
    const result = await runLocalDivination(input);

    expect(() => assertSchemaValue(result, resultSchema)).not.toThrow();
    expect(Object.prototype.hasOwnProperty.call(result.interpretation, "candidateClaims")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result.interpretation, "selectedFragments")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result.ethics, "controlledMessages")).toBe(false);
  });
});
