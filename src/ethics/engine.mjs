/**
 * Local, fail-closed ethics rule engine.
 *
 * The engine consumes only structured request fields, claims, fragments and
 * registered knowledge. In particular, questionText is intentionally never
 * inspected here.
 */

const SEVERITIES = Object.freeze([
  "notice",
  "language-constraint",
  "hard-constraint",
  "hard-block",
  "hard-stop",
]);

const MODES = Object.freeze([
  "allow",
  "allow_with_constraints",
  "hard_block",
  "hard_stop",
]);

const CONDITION_TYPES = new Set([
  "always",
  "domainEquals",
  "factEquals",
  "questionHasAnyFlag",
  "outputContainsAnyTag",
]);

const EFFECT_TYPES = new Set([
  "suppress_claim_types",
  "force_conclusion",
  "block_fragments_with_tags",
  "allow_topics",
  "preferred_terms",
  "forbid_terms_as_inference",
  "require_reality_action",
  "stop_divination_as_primary_action",
  "forbid_action_types",
  "replace_certainty_terms",
  "forbid_certainty_terms",
  "preferred_modal_terms",
  "assert_invariant",
  "assert_priority",
  "append_reality_check_when_conflict",
  "historical_text_only",
  "append_context",
  "require_evidence_language",
  "exclude_from_core_input",
]);

const INVARIANTS = new Set([
  "identity_fields_do_not_change_palace",
  "ethics_does_not_change_final_palace",
]);

const SEVERITY_RANK = new Map(SEVERITIES.map((severity, index) => [severity, index]));

export class EthicsEngineError extends Error {
  constructor(code, message, details = undefined) {
    super(`${code}: ${message}`);
    this.name = "EthicsEngineError";
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new EthicsEngineError(code, message, details);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    fail("RULE_CONFIG_ERROR", `${label} must be a non-empty string`);
  }
  return value;
}

function requireBoolean(value, label) {
  if (typeof value !== "boolean") {
    fail("RULE_CONFIG_ERROR", `${label} must be boolean`);
  }
  return value;
}

function requireStringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) {
    fail("RULE_CONFIG_ERROR", `${label} must be an array of non-empty strings`);
  }
  return value;
}

function unique(values) {
  return [...new Set(values)];
}

function uniqueSortedByRuleOrder(values, ruleOrder) {
  const seen = new Set();
  return values
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .sort((left, right) => (ruleOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (ruleOrder.get(right) ?? Number.MAX_SAFE_INTEGER));
}

function compareRules(left, right) {
  if (left.priority !== right.priority) return right.priority - left.priority;
  return left.id.localeCompare(right.id);
}

function normalizeRegistry(registry) {
  if (!isObject(registry)) fail("RULE_CONFIG_ERROR", "safetyMessages must be an object");
  const normalized = {};
  for (const kind of ["conclusions", "realityActions", "contexts"]) {
    const collection = registry[kind];
    if (Array.isArray(collection)) {
      normalized[kind] = new Map(collection.map((message) => {
        if (!isObject(message)) fail("RULE_CONFIG_ERROR", `${kind} entries must be objects`);
        const id = requireString(message.id, `${kind}.id`);
        requireString(message.text, `${kind}.${id}.text`);
        return [id, message];
      }));
    } else if (isObject(collection)) {
      normalized[kind] = new Map(Object.entries(collection).map(([id, message]) => {
        if (!isObject(message)) fail("RULE_CONFIG_ERROR", `${kind}.${id} must be an object`);
        requireString(message.text, `${kind}.${id}.text`);
        return [id, { ...message, id }];
      }));
    } else {
      fail("RULE_CONFIG_ERROR", `safetyMessages.${kind} must be an array or object`);
    }
  }
  return normalized;
}

function resolveMessage(registry, kind, id) {
  requireString(id, `${kind} code`);
  const message = registry[kind].get(id);
  if (!message) fail(`UNKNOWN_${kind.toUpperCase()}_CODE`, `unregistered ${kind} code: ${id}`);
  return message;
}

function validateCondition(condition, ruleId) {
  if (!isObject(condition)) fail("RULE_CONFIG_ERROR", `${ruleId}.when must be an object`);
  const keys = Object.keys(condition);
  if (keys.length !== 1 || !CONDITION_TYPES.has(keys[0])) {
    fail("UNKNOWN_CONDITION_ERROR", `unknown condition in rule ${ruleId}`);
  }
  const type = keys[0];
  const operand = condition[type];
  if (type === "always") {
    requireBoolean(operand, `${ruleId}.when.always`);
  } else if (type === "domainEquals") {
    requireString(operand, `${ruleId}.when.domainEquals`);
  } else if (type === "factEquals") {
    if (!isObject(operand) || Object.keys(operand).length !== 1) {
      fail("RULE_CONFIG_ERROR", `${ruleId}.when.factEquals must contain one path`);
    }
    const [path, expected] = Object.entries(operand)[0];
    requireString(path, `${ruleId}.when.factEquals path`);
    if (!["boolean", "string", "number"].includes(typeof expected) && expected !== null) {
      fail("RULE_CONFIG_ERROR", `${ruleId}.when.factEquals value must be scalar`);
    }
  } else {
    requireStringArray(operand, `${ruleId}.when.${type}`);
  }
}

function validateEffect(effect, ruleId, registry) {
  if (!isObject(effect)) fail("RULE_CONFIG_ERROR", `${ruleId}.effects entries must be objects`);
  const type = requireString(effect.type, `${ruleId}.effect.type`);
  if (!EFFECT_TYPES.has(type)) fail("UNKNOWN_EFFECT_ERROR", `unknown effect ${type} in rule ${ruleId}`);

  if (type === "suppress_claim_types" || type === "block_fragments_with_tags" || type === "allow_topics" || type === "preferred_terms" || type === "forbid_terms_as_inference" || type === "forbid_action_types" || type === "forbid_certainty_terms" || type === "preferred_modal_terms" || type === "historical_text_only") {
    const field = type === "suppress_claim_types" ? "claimTypes" : type === "block_fragments_with_tags" ? "tags" : type === "allow_topics" ? "topics" : type === "forbid_action_types" ? "actionTypes" : "terms";
    requireStringArray(effect[field], `${ruleId}.effect.${field}`);
  } else if (type === "force_conclusion") {
    resolveMessage(registry, "conclusions", effect.conclusionCode);
  } else if (type === "require_reality_action") {
    resolveMessage(registry, "realityActions", effect.actionCode);
  } else if (type === "append_context") {
    resolveMessage(registry, "contexts", effect.contextCode);
  } else if (type === "stop_divination_as_primary_action" || type === "append_reality_check_when_conflict" || type === "require_evidence_language") {
    requireBoolean(effect.value, `${ruleId}.effect.${type}.value`);
    if (type === "append_reality_check_when_conflict") resolveMessage(registry, "contexts", "verified_reality_has_priority");
  } else if (type === "replace_certainty_terms") {
    if (!isObject(effect.mapping) || Object.entries(effect.mapping).some(([from, to]) => !from || typeof to !== "string" || !to)) {
      fail("RULE_CONFIG_ERROR", `${ruleId}.effect.mapping must map strings to non-empty strings`);
    }
  } else if (type === "assert_invariant") {
    requireString(effect.invariant, `${ruleId}.effect.invariant`);
    if (!INVARIANTS.has(effect.invariant)) fail("UNKNOWN_INVARIANT_ERROR", `unknown invariant ${effect.invariant}`);
  } else if (type === "assert_priority") {
    requireString(effect.higher, `${ruleId}.effect.higher`);
    requireString(effect.lower, `${ruleId}.effect.lower`);
  } else if (type === "exclude_from_core_input") {
    requireStringArray(effect.fields, `${ruleId}.effect.fields`);
  }
}

function validateRules(rules, registry) {
  if (!Array.isArray(rules)) fail("RULE_CONFIG_ERROR", "rules must be an array");
  const ids = new Set();
  for (const rule of rules) {
    if (!isObject(rule)) fail("RULE_CONFIG_ERROR", "rules entries must be objects");
    const id = requireString(rule.id, "rule.id");
    if (ids.has(id)) fail("RULE_CONFIG_ERROR", `duplicate rule id: ${id}`);
    ids.add(id);
    if (typeof rule.priority !== "number" || !Number.isFinite(rule.priority)) fail("RULE_CONFIG_ERROR", `${id}.priority must be finite`);
    requireString(rule.severity, `${id}.severity`);
    if (!SEVERITY_RANK.has(rule.severity)) fail("RULE_CONFIG_ERROR", `unknown severity ${rule.severity}`);
    if (rule.scope !== undefined) requireStringArray(rule.scope, `${id}.scope`);
    validateCondition(rule.when, id);
    if (!Array.isArray(rule.effects)) fail("RULE_CONFIG_ERROR", `${id}.effects must be an array`);
    for (const effect of rule.effects) validateEffect(effect, id, registry);
    if (rule.requiredNotice !== null && rule.requiredNotice !== undefined) requireString(rule.requiredNotice, `${id}.requiredNotice`);
  }
}

function validateInput(input) {
  if (!isObject(input)) fail("INPUT_ERROR", "input must be an object");
  requireString(input.domainId, "domainId");
  if (input.stageId !== null && input.stageId !== undefined) requireString(input.stageId, "stageId");
  if (!isObject(input.questionContext)) fail("INPUT_ERROR", "questionContext must be an object");
  if (!isObject(input.questionContext.facts)) fail("INPUT_ERROR", "questionContext.facts must be an object");
  requireStringArray(input.questionContext.flags ?? [], "questionContext.flags");
  if (!Array.isArray(input.candidateClaims)) fail("INPUT_ERROR", "candidateClaims must be an array");
  if (!Array.isArray(input.selectedFragments)) fail("INPUT_ERROR", "selectedFragments must be an array");
  for (const claim of input.candidateClaims) {
    if (!isObject(claim)) fail("INPUT_ERROR", "candidateClaims entries must be objects");
    requireString(claim.id, "candidateClaim.id");
    requireString(claim.type, `candidateClaim ${claim.id}.type`);
    if (claim.tags !== undefined) requireStringArray(claim.tags, `candidateClaim ${claim.id}.tags`);
  }
  for (const fragment of input.selectedFragments) {
    if (!isObject(fragment)) fail("INPUT_ERROR", "selectedFragments entries must be objects");
    requireString(fragment.id, "selectedFragment.id");
    if (fragment.tags !== undefined) requireStringArray(fragment.tags, `selectedFragment ${fragment.id}.tags`);
  }
}

function scopeMatches(rule, domainId) {
  return !rule.scope || rule.scope.includes("all") || rule.scope.includes(domainId);
}

function getFact(questionContext, path) {
  const segments = path.split(".");
  let value = questionContext;
  for (const segment of segments) {
    if (!isObject(value) || !Object.prototype.hasOwnProperty.call(value, segment)) {
      fail("RULE_CONFIG_ERROR", `fact path does not exist: ${path}`);
    }
    value = value[segment];
  }
  return value;
}

function matchesCondition(condition, input) {
  const type = Object.keys(condition)[0];
  const operand = condition[type];
  if (type === "always") return operand === true;
  if (type === "domainEquals") return input.domainId === operand;
  if (type === "factEquals") {
    const [path, expected] = Object.entries(operand)[0];
    return getFact(input.questionContext, path) === expected;
  }
  if (type === "questionHasAnyFlag") return operand.some((flag) => input.questionContext.flags.includes(flag));
  if (type === "outputContainsAnyTag") {
    const tags = new Set([
      ...input.candidateClaims.flatMap((claim) => claim.tags ?? []),
      ...input.selectedFragments.flatMap((fragment) => fragment.tags ?? []),
    ]);
    return operand.some((tag) => tags.has(tag));
  }
  fail("UNKNOWN_CONDITION_ERROR", `unknown condition ${type}`);
}

function matchesRegisteredRule(rule, input) {
  // A generic immediate-safety flag must not be promoted into a missing-person
  // fact. The missing-person rule has dedicated structured flags for that case.
  if (rule.id === "missing-person-emergency-escalation") {
    const missingPersonFlags = new Set(["missing_person", "unreachable_with_danger", "abduction"]);
    if (!input.questionContext.flags.some((flag) => missingPersonFlags.has(flag))) return false;
  }
  return matchesCondition(rule.when, input);
}

function getPalacePair(input) {
  const candidates = [
    [input.finalPalaceIdBefore, input.finalPalaceIdAfter],
    [input.beforeFinalPalaceId, input.afterFinalPalaceId],
    [input.palaceInvariant?.beforeFinalPalaceId, input.palaceInvariant?.afterFinalPalaceId],
    [input.calculationSnapshot?.beforeFinalPalaceId, input.calculationSnapshot?.afterFinalPalaceId],
  ];
  return candidates.find(([before, after]) => before !== undefined || after !== undefined) ?? [undefined, undefined];
}

export function assertFinalPalaceInvariant(beforeFinalPalaceId, afterFinalPalaceId) {
  requireString(beforeFinalPalaceId, "beforeFinalPalaceId");
  requireString(afterFinalPalaceId, "afterFinalPalaceId");
  if (beforeFinalPalaceId !== afterFinalPalaceId) {
    fail("INVARIANT_ASSERTION_ERROR", "ethics evaluation changed finalPalaceId", { beforeFinalPalaceId, afterFinalPalaceId });
  }
  return true;
}

function applyInvariant(invariant, input) {
  if (invariant === "ethics_does_not_change_final_palace") {
    const [before, after] = getPalacePair(input);
    if (before !== undefined || after !== undefined) assertFinalPalaceInvariant(before, after);
  } else if (invariant === "identity_fields_do_not_change_palace") {
    if (input.identityFieldsChanged === true || input.invariantChecks?.identityFieldsDoNotChangePalace === false) {
      fail("INVARIANT_ASSERTION_ERROR", "identity fields changed finalPalaceId");
    }
  } else {
    fail("UNKNOWN_INVARIANT_ERROR", `unknown invariant ${invariant}`);
  }
}

function addTrace(state, event) {
  state.trace.push(Object.freeze({ ...event }));
}

function applyEffect(effect, rule, input, registry, state) {
  const type = effect.type;
  addTrace(state, { ruleId: rule.id, effectType: type });
  if (type === "suppress_claim_types") {
    for (const claimType of effect.claimTypes) state.suppressedTypes.push({ claimType, ruleId: rule.id, priority: rule.priority });
  } else if (type === "force_conclusion") {
    state.forceConclusions.push({ code: effect.conclusionCode, ruleId: rule.id, priority: rule.priority });
  } else if (type === "block_fragments_with_tags") {
    state.blockTags.push({ tags: effect.tags, ruleId: rule.id, priority: rule.priority });
  } else if (type === "allow_topics") {
    state.allowedTopics.push(...effect.topics);
  } else if (type === "preferred_terms") {
    state.preferredTerms.push(...effect.terms);
  } else if (type === "forbid_terms_as_inference") {
    state.forbiddenTerms.push(...effect.terms);
  } else if (type === "require_reality_action") {
    resolveMessage(registry, "realityActions", effect.actionCode);
    state.realityActions.push(effect.actionCode);
  } else if (type === "stop_divination_as_primary_action") {
    if (effect.value) state.stopDivination = true;
  } else if (type === "forbid_action_types") {
    state.forbiddenActionTypes.push(...effect.actionTypes);
  } else if (type === "replace_certainty_terms") {
    state.replacements.push({ ruleId: rule.id, mapping: { ...effect.mapping } });
    for (const [from, to] of Object.entries(effect.mapping)) {
      addTrace(state, { ruleId: rule.id, effectType: type, from, to });
    }
  } else if (type === "forbid_certainty_terms") {
    state.forbiddenCertaintyTerms.push(...effect.terms);
  } else if (type === "preferred_modal_terms") {
    state.preferredModalTerms.push(...effect.terms);
  } else if (type === "assert_invariant") {
    applyInvariant(effect.invariant, input);
  } else if (type === "assert_priority") {
    state.priorities.push({ higher: effect.higher, lower: effect.lower });
  } else if (type === "append_reality_check_when_conflict") {
    if (effect.value) state.contexts.push("verified_reality_has_priority");
  } else if (type === "historical_text_only") {
    state.historicalTerms.push(...effect.terms);
  } else if (type === "append_context") {
    resolveMessage(registry, "contexts", effect.contextCode);
    state.contexts.push(effect.contextCode);
  } else if (type === "require_evidence_language") {
    if (effect.value) state.evidenceLanguage = true;
  } else if (type === "exclude_from_core_input") {
    state.excludedCoreFields.push(...effect.fields);
  } else {
    fail("UNKNOWN_EFFECT_ERROR", `unknown effect ${type}`);
  }
}

function resolveForceConclusions(candidates) {
  const byCode = new Map();
  for (const candidate of candidates) {
    const current = byCode.get(candidate.code);
    if (!current || candidate.priority > current.priority) byCode.set(candidate.code, candidate);
  }
  const winners = [...byCode.values()].filter((candidate) => candidate.priority === Math.max(...[...byCode.values()].map((item) => item.priority)));
  if (winners.length > 1) {
    fail("RULE_CONFLICT_ERROR", "conflicting force_conclusion effects at the same priority", { codes: winners.map((winner) => winner.code) });
  }
  return winners.length === 1 ? [winners[0].code] : [];
}

function buildSuppressedClaims(claims, suppressedTypes, blockedFragmentIds, blockTags) {
  const events = [];
  for (const claim of claims) {
    for (const suppression of suppressedTypes) {
      if (claim.type === suppression.claimType) {
        events.push({
          claimId: claim.id,
          ruleId: suppression.ruleId,
          originalFragmentId: claim.fragmentId ?? claim.sourceFragmentId ?? null,
          reason: `claim_type:${suppression.claimType}`,
        });
      }
    }
    const fragmentId = claim.fragmentId ?? claim.sourceFragmentId;
    if (fragmentId && blockedFragmentIds.has(fragmentId)) {
      const blocker = blockTags.find((entry) => entry.tags.some((tag) => (claim.tags ?? []).includes(tag)));
      events.push({
        claimId: claim.id,
        ruleId: blocker?.ruleId ?? "fragment-block",
        originalFragmentId: fragmentId,
        reason: "fragment_blocked",
      });
    }
  }
  return events;
}

function modeForSeverity(severity) {
  if (severity === "hard-stop") return "hard_stop";
  if (severity === "hard-block") return "hard_block";
  if (severity === "language-constraint" || severity === "hard-constraint") return "allow_with_constraints";
  return "allow";
}

export function evaluateEthics(input) {
  validateInput(input);
  const registry = normalizeRegistry(input.safetyMessages);
  validateRules(input.rules, registry);
  const rules = [...input.rules].sort(compareRules);
  const ruleOrder = new Map(rules.map((rule, index) => [rule.id, index]));
  const state = {
    severity: "notice",
    suppressedTypes: [],
    forceConclusions: [],
    blockTags: [],
    allowedTopics: [],
    preferredTerms: [],
    forbiddenTerms: [],
    realityActions: [],
    stopDivination: false,
    forbiddenActionTypes: [],
    replacements: [],
    forbiddenCertaintyTerms: [],
    preferredModalTerms: [],
    priorities: [],
    contexts: [],
    historicalTerms: [],
    evidenceLanguage: false,
    excludedCoreFields: [],
    notices: [],
    matchedRules: [],
    trace: [],
  };

  for (const rule of rules) {
    if (!scopeMatches(rule, input.domainId) || !matchesRegisteredRule(rule, input)) continue;
    state.matchedRules.push(rule);
    if (SEVERITY_RANK.get(rule.severity) > SEVERITY_RANK.get(state.severity)) state.severity = rule.severity;
    if (rule.requiredNotice) state.notices.push(rule.requiredNotice);
    addTrace(state, { ruleId: rule.id, event: "matched", conditionType: Object.keys(rule.when)[0] });
    for (const effect of rule.effects) applyEffect(effect, rule, input, registry, state);
  }

  const blockedFragmentIds = new Set();
  for (const fragment of input.selectedFragments) {
    const fragmentTags = new Set(fragment.tags ?? []);
    if (state.blockTags.some((entry) => entry.tags.some((tag) => fragmentTags.has(tag)))) blockedFragmentIds.add(fragment.id);
  }
  const suppressedClaims = buildSuppressedClaims(input.candidateClaims, state.suppressedTypes, blockedFragmentIds, state.blockTags);
  const suppressedClaimIds = new Set(suppressedClaims.map((event) => event.claimId));
  const retainedClaims = input.candidateClaims.filter((claim) => !suppressedClaimIds.has(claim.id)).map((claim) => ({ ...claim }));

  if (state.stopDivination) state.severity = "hard-stop";
  const forcedConclusionCodes = resolveForceConclusions(state.forceConclusions);
  const suppressedTypeSet = new Set(state.suppressedTypes.map((entry) => entry.claimType));
  const forbiddenTermSet = new Set(state.forbiddenTerms);
  const conflictingTerms = unique(state.preferredTerms.filter((term) => forbiddenTermSet.has(term)));
  if (conflictingTerms.length > 0) {
    addTrace(state, { event: "knowledge_config_conflict", conflictType: "forbidden_over_preferred", terms: conflictingTerms });
  }
  const allowedTopics = state.allowedTopics.filter((topic) => !suppressedTypeSet.has(topic));

  return {
    mode: modeForSeverity(state.severity),
    triggeredRuleIds: state.matchedRules.map((rule) => rule.id),
    retainedClaims,
    suppressedClaims,
    retainedFragmentIds: input.selectedFragments.filter((fragment) => !blockedFragmentIds.has(fragment.id)).map((fragment) => fragment.id),
    blockedFragmentIds: input.selectedFragments.filter((fragment) => blockedFragmentIds.has(fragment.id)).map((fragment) => fragment.id),
    forcedConclusionCodes,
    requiredNotices: uniqueSortedByRuleOrder(state.notices, ruleOrder),
    requiredRealityActionCodes: uniqueSortedByRuleOrder(state.realityActions, ruleOrder),
    contextCodes: uniqueSortedByRuleOrder(state.contexts, ruleOrder),
    allowedTopics: unique(state.allowedTopics.filter((topic) => !suppressedTypeSet.has(topic))),
    forbiddenActionTypes: unique(state.forbiddenActionTypes),
    preferredTerms: unique(state.preferredTerms.filter((term) => !forbiddenTermSet.has(term))),
    forbiddenTerms: unique(state.forbiddenTerms),
    trace: state.trace,
    // These fields are metadata for the local renderer, not generated prose.
    certaintyPolicy: {
      forbiddenTerms: unique(state.forbiddenCertaintyTerms),
      preferredModalTerms: unique(state.preferredModalTerms),
      replacements: state.replacements,
    },
    evidenceLanguageRequired: state.evidenceLanguage,
    historicalTextOnlyTerms: unique(state.historicalTerms),
    excludedFromCoreInput: unique(state.excludedCoreFields),
    priorityAssertions: state.priorities,
  };
}
