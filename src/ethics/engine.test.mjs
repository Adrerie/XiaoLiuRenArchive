import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { EthicsEngineError, assertFinalPalaceInvariant, evaluateEthics } from "./engine.mjs";

const knowledge = JSON.parse(await readFile(new URL("../../knowledge/ethics-rules.v1.json", import.meta.url), "utf8"));
const safetyMessages = JSON.parse(await readFile(new URL("../../knowledge/safety-messages.v1.json", import.meta.url), "utf8"));
const cases = JSON.parse(await readFile(new URL("../../fixtures/ethics-red-team-cases.v1.json", import.meta.url), "utf8")).cases;
const selectedCases = new Set([
  "redteam-explicit-refusal-hidden-love",
  "redteam-third-party-orientation",
  "redteam-health-risk-exclusion",
  "redteam-investment-guarantee",
  "redteam-missing-person-delay",
]);

function makeInput(redTeamCase) {
  const request = redTeamCase.request;
  const expectedClaims = [
    ...(redTeamCase.expected.mustSuppressClaimTypes ?? []).map((type, index) => ({ id: `suppressed-${index}`, type, fragmentId: "fragment-risk", tags: [type] })),
    { id: "neutral", type: "neutral_interpretation", fragmentId: "fragment-neutral", tags: ["neutral"] },
  ];
  const fragments = [
    { id: "fragment-neutral", tags: ["neutral"] },
    { id: "fragment-risk", tags: ["hidden_yes", "persistence_will_win", "refusal_is_test", "no_hope", "fatal_certainty"] },
  ];
  return {
    domainId: request.questionContext.domainId,
    stageId: request.questionContext.stageId,
    questionContext: request.questionContext,
    candidateClaims: expectedClaims,
    selectedFragments: fragments,
    rules: knowledge.rules,
    safetyMessages,
    finalPalaceIdBefore: redTeamCase.calculationFixture.finalPalaceId,
    finalPalaceIdAfter: redTeamCase.calculationFixture.finalPalaceId,
  };
}

for (const redTeamCase of cases.filter((item) => selectedCases.has(item.id))) {
  test(`ethics guard: ${redTeamCase.id}`, () => {
    const result = evaluateEthics(makeInput(redTeamCase));
    assert.equal(result.mode, redTeamCase.expected.mode);
    assert.equal(result.forcedConclusionCodes.join(","), (redTeamCase.expected.mustForceConclusionCodes ?? []).join(","));
    for (const ruleId of redTeamCase.expected.mustTriggerRuleIds) assert.ok(result.triggeredRuleIds.includes(ruleId), ruleId);
    for (const claimType of redTeamCase.expected.mustSuppressClaimTypes) {
      assert.ok(result.suppressedClaims.some((claim) => claim.reason === `claim_type:${claimType}`), claimType);
    }
    for (const actionCode of redTeamCase.expected.mustRequireRealityActions ?? []) assert.ok(result.requiredRealityActionCodes.includes(actionCode), actionCode);
    assert.equal(result.retainedClaims.some((claim) => redTeamCase.expected.mustSuppressClaimTypes.includes(claim.type)), false);
    assertFinalPalaceInvariant(redTeamCase.calculationFixture.finalPalaceId, redTeamCase.calculationFixture.finalPalaceId);
  });
}

test("rules are deterministic and unknown configuration fails closed", () => {
  const input = makeInput(cases.find((item) => item.id === "redteam-explicit-refusal-hidden-love"));
  const reversed = { ...input, rules: [...input.rules].reverse() };
  assert.deepEqual(evaluateEthics(input), evaluateEthics(reversed));
  assert.throws(() => evaluateEthics({ ...input, rules: [{ ...input.rules[0], when: { unknownCondition: true } }] }), (error) => error instanceof EthicsEngineError && error.code === "UNKNOWN_CONDITION_ERROR");
  assert.throws(() => evaluateEthics({ ...input, rules: [{ ...input.rules[0], effects: [{ type: "unknown_effect" }] }] }), (error) => error instanceof EthicsEngineError && error.code === "UNKNOWN_EFFECT_ERROR");
});

test("final palace invariant rejects an ethics-side change", () => {
  assert.throws(() => assertFinalPalaceInvariant("su_xi", "chi_kou"), (error) => error instanceof EthicsEngineError && error.code === "INVARIANT_ASSERTION_ERROR");
});

