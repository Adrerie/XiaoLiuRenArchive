import { strict as assert } from "node:assert";
import test from "node:test";

import {
  PALACE_ORDER,
  CoreError,
  computeDivination,
  positiveMod,
} from "./index.ts";

test("freezes the six-palace order", () => {
  assert.deepEqual(PALACE_ORDER, [
    "da_an",
    "liu_lian",
    "su_xi",
    "chi_kou",
    "xiao_ji",
    "kong_wang",
  ]);
});

test("matches the classical third-month fifth-day chen case", () => {
  const result = computeDivination({
    lunarMonth: 3,
    lunarDay: 5,
    earthlyBranchIndex: 5,
  });

  assert.equal(result.month.resultIndex, 2);
  assert.equal(result.month.resultPalaceId, "su_xi");
  assert.equal(result.day.resultIndex, 0);
  assert.equal(result.day.resultPalaceId, "da_an");
  assert.equal(result.hour.resultIndex, 4);
  assert.equal(result.hour.resultPalaceId, "xiao_ji");
  assert.equal(result.finalPalaceId, "xiao_ji");
  assert.deepEqual(result.month.visitedPalaceIds, ["da_an", "liu_lian", "su_xi"]);
  assert.deepEqual(result.day.visitedPalaceIds, [
    "su_xi",
    "chi_kou",
    "xiao_ji",
    "kong_wang",
    "da_an",
  ]);
  assert.deepEqual(result.hour.visitedPalaceIds, [
    "da_an",
    "liu_lian",
    "su_xi",
    "chi_kou",
    "xiao_ji",
  ]);
});

test("is deterministic, cyclic, and agrees with the compressed formula", () => {
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= 30; day += 1) {
      for (let branch = 1; branch <= 12; branch += 1) {
        const result = computeDivination({
          lunarMonth: month,
          lunarDay: day,
          earthlyBranchIndex: branch,
        });
        const repeat = computeDivination({
          lunarMonth: month,
          lunarDay: day,
          earthlyBranchIndex: branch,
        });

        assert.deepEqual(result, repeat);
        assert.equal(
          result.hour.resultIndex,
          positiveMod(month + day + branch - 3, 6),
        );
        assert.equal(result.month.visitedPalaceIds.length, month);
        assert.equal(result.day.visitedPalaceIds.length, day);
        assert.equal(result.hour.visitedPalaceIds.length, branch);
      }
    }
  }
});

test("rejects invalid and missing inputs with typed core errors", () => {
  const cases: Array<[unknown, string]> = [
    [{ lunarMonth: 0, lunarDay: 1, earthlyBranchIndex: 1 }, "INVALID_LUNAR_MONTH"],
    [{ lunarMonth: 13, lunarDay: 1, earthlyBranchIndex: 1 }, "INVALID_LUNAR_MONTH"],
    [{ lunarMonth: 1, lunarDay: 0, earthlyBranchIndex: 1 }, "INVALID_LUNAR_DAY"],
    [{ lunarMonth: 1, lunarDay: 31, earthlyBranchIndex: 1 }, "INVALID_LUNAR_DAY"],
    [{ lunarMonth: 1, lunarDay: 1, earthlyBranchIndex: 0 }, "INVALID_EARTHLY_BRANCH_INDEX"],
    [{ lunarMonth: 1, lunarDay: 1, earthlyBranchIndex: 13 }, "INVALID_EARTHLY_BRANCH_INDEX"],
    [{ lunarMonth: 1, lunarDay: 1.5, earthlyBranchIndex: 1 }, "NON_INTEGER_INPUT"],
    [{ lunarMonth: 1, lunarDay: 1 }, "MISSING_INPUT_FIELD"],
  ];

  for (const [input, expectedCode] of cases) {
    assert.throws(
      () => computeDivination(input as never),
      (error: unknown) => error instanceof CoreError && error.code === expectedCode,
    );
  }
});

test("ignores unrelated metadata because it is outside the core API", () => {
  const base = computeDivination({ lunarMonth: 3, lunarDay: 5, earthlyBranchIndex: 5 });
  const withMetadata = computeDivination({
    lunarMonth: 3,
    lunarDay: 5,
    earthlyBranchIndex: 5,
    identity: "must not affect the core",
    question: "must not affect the core",
  } as never);

  assert.deepEqual(withMetadata, base);
});
