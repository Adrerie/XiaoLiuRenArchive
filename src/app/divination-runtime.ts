import {
  fromGregorian,
  fromManualLunar,
  type EarthlyBranch as ChineseEarthlyBranch,
  type GregorianDateTimeInput,
  type ManualLunarInput,
} from "../calendar";
import {
  computeDivination,
  PALACE_ORDER as CORE_PALACE_ORDER,
  type PalaceStep,
} from "../core";
import { computeThreeNumberCasting } from "../core/three-number";
import {
  assertFinalPalaceInvariant,
  evaluateEthics,
  type RawEthicsResult,
} from "../ethics";
import {
  getContextSourceIds,
  getEthicsRulesVersion,
  getKnowledgeManifest,
  getPalace,
  getKnowledgeVersion,
  getSources,
  isProvisionalSource,
  selectInterpretation,
} from "../knowledge";
import {
  AppError,
  type CastingSummary,
  type CalendarResultInput,
  type CandidateClaim,
  type CalculationInput,
  type CalculationResult,
  type CalendarResult,
  type ContentBlock,
  type DivinationRequest,
  type DivinationResult,
  type EarthlyBranch,
  type EthicsResult,
  type InterpretationSections,
  type InterpretationResult,
  type PalaceId,
  type Provenance,
  type QuestionContext,
  type ResultInput,
  type SelectedFragment,
  type ThreeNumberCalculationInput,
  type ThreeNumberResultInput,
} from "../shared";
import {
  createDivinationService,
  type CalendarResolution,
  type DivinationDependencies,
  type DivinationService,
} from "../services/divination-service";
import ethicsRulesJson from "../../knowledge/ethics-rules.v1.json";
import safetyMessagesJson from "../../knowledge/safety-messages.v1.json";

const BRANCH_TO_PINYIN: Readonly<Record<ChineseEarthlyBranch, EarthlyBranch>> = {
  子: "zi",
  丑: "chou",
  寅: "yin",
  卯: "mao",
  辰: "chen",
  巳: "si",
  午: "wu",
  未: "wei",
  申: "shen",
  酉: "you",
  戌: "xu",
  亥: "hai",
};

const PALACE_IDS = new Set<PalaceId>(CORE_PALACE_ORDER);

type JsonObject = Readonly<Record<string, unknown>>;

interface RuntimeQuestionContext {
  readonly domainId: string;
  readonly stageId: string | null;
  readonly flags: readonly string[];
  readonly facts: Readonly<Record<string, boolean | number | string | null>>;
}

function jsonObject(value: unknown, label: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppError("ETHICS_ERROR", `${label} must be an object`, { recoverable: false });
  }
  return value as JsonObject;
}

function jsonString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError("ETHICS_ERROR", `${label} must be a non-empty string`, { recoverable: false });
  }
  return value;
}

function jsonRecords(value: unknown, label: string): readonly Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new AppError("ETHICS_ERROR", `${label} must be an array`, { recoverable: false });
  }
  return value.map((item, index) => jsonObject(item, `${label}[${index}]`));
}

function contextFor(request: DivinationRequest): RuntimeQuestionContext {
  const context: QuestionContext = request.questionContext;
  const domainId = typeof context.domainId === "string" && context.domainId.length > 0
    ? context.domainId
    : "relationship";
  const stageId = context.stageId === undefined || context.stageId === null
    ? null
    : typeof context.stageId === "string" && context.stageId.length > 0
      ? context.stageId
      : null;
  const flags = context.flags === undefined ? [] : [...context.flags];
  if (flags.some((flag) => typeof flag !== "string")) {
    throw new AppError("INVALID_REQUEST", "questionContext.flags must contain strings", { field: "flags" });
  }
  const incomingFacts = context.facts ?? {};
  const facts: Record<string, boolean | number | string | null> = {
    explicitRefusalExists: false,
    formalNoticeExists: false,
    professionalOpinionExists: false,
    immediateSafetyRisk: false,
  };
  for (const [key, value] of Object.entries(incomingFacts)) {
    if (typeof value !== "boolean" && typeof value !== "number" && typeof value !== "string" && value !== null) {
      throw new AppError("INVALID_REQUEST", `questionContext.facts.${key} has an unsupported value`, { field: key });
    }
    facts[key] = value;
  }
  return { domainId, stageId, flags: [...new Set(flags)], facts };
}

function branchName(value: ChineseEarthlyBranch): EarthlyBranch {
  return BRANCH_TO_PINYIN[value];
}

function asPalaceId(value: string): PalaceId {
  if (!PALACE_IDS.has(value as PalaceId)) {
    throw new AppError("CORE_ERROR", `Unknown palace returned by core: ${value}`, { recoverable: false });
  }
  return value as PalaceId;
}

function palaceIndex(value: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (!Number.isInteger(value) || value < 0 || value > 5) {
    throw new AppError("CORE_ERROR", `Core returned an invalid palace index: ${value}`, { recoverable: false });
  }
  return value as 0 | 1 | 2 | 3 | 4 | 5;
}

function toStep(step: PalaceStep): {
  readonly stage: "month" | "day" | "hour";
  readonly startPalaceId: PalaceId;
  readonly countValue: number;
  readonly offset: number;
  readonly resultIndex: 0 | 1 | 2 | 3 | 4 | 5;
  readonly resultPalaceId: PalaceId;
  readonly formula: string;
} {
  return {
    stage: step.stage,
    startPalaceId: step.startPalaceId,
    countValue: step.countValue,
    offset: step.countValue - 1,
    resultIndex: palaceIndex(step.resultIndex),
    resultPalaceId: step.resultPalaceId,
    formula: `${step.stage}: positiveMod(startIndex + countValue - 1, 6)`,
  };
}

function calculate(input: CalculationInput): CalculationResult {
  if (input.kind === "three_numbers") {
    return computeThreeNumberCasting(input);
  }
  const coreResult = computeDivination({
    lunarMonth: input.lunarMonth,
    lunarDay: input.lunarDay,
    earthlyBranchIndex: input.earthlyBranchIndex,
  });
  return {
    algorithmId: "traditional-month-day-hour-v1",
    algorithmStatus: "FROZEN-PROVISIONAL",
    palaceOrder: CORE_PALACE_ORDER,
    monthIndex: palaceIndex(coreResult.month.resultIndex),
    dayIndex: palaceIndex(coreResult.day.resultIndex),
    hourIndex: palaceIndex(coreResult.hour.resultIndex),
    monthPalaceId: coreResult.month.resultPalaceId,
    dayPalaceId: coreResult.day.resultPalaceId,
    finalPalaceId: coreResult.finalPalaceId,
    trace: [toStep(coreResult.month), toStep(coreResult.day), toStep(coreResult.hour)],
  };
}

function resolveCasting(request: DivinationRequest, context: RuntimeQuestionContext): CalendarResolution {
  try {
    if (request.casting.kind === "three_numbers") {
      const input: ThreeNumberResultInput = {
        kind: "three_numbers",
        numbers: { ...request.casting.input },
        timezone: null,
        domainId: context.domainId,
        stageId: context.stageId,
        questionFlags: context.flags,
        privacy: {
          questionTextStored: false,
          questionTextIncludedInExport: false,
        },
      };
      return {
        casting: {
          kind: "three_numbers",
          algorithmId: "three-number-sequential-count-v1",
          input: { ...request.casting.input },
        },
        input,
        calendar: null,
        calculationInput: { ...request.casting.input },
      };
    }

    const casting = request.casting;
    if (casting.inputMode === "manual_lunar" && casting.timeInput.kind !== "manual_lunar") {
      throw new AppError("INVALID_REQUEST", "manual_lunar inputMode requires manual_lunar timeInput", { field: "timeInput.kind" });
    }
    if (casting.inputMode === "civil_datetime" && casting.timeInput.kind !== "civil_datetime") {
      throw new AppError("INVALID_REQUEST", "civil_datetime inputMode requires civil_datetime timeInput", { field: "timeInput.kind" });
    }
    const normalized = casting.inputMode === "manual_lunar"
      ? fromManualLunar({
          kind: "manual_lunar",
          lunarMonth: casting.timeInput.kind === "manual_lunar" ? casting.timeInput.lunarMonth : 0,
          lunarDay: casting.timeInput.kind === "manual_lunar" ? casting.timeInput.lunarDay : 0,
          earthlyBranchIndex: casting.timeInput.kind === "manual_lunar" ? casting.timeInput.earthlyBranchIndex : 0,
          isLeapMonth: casting.timeInput.kind === "manual_lunar" ? casting.timeInput.isLeapMonth : false,
          timezone: casting.timeInput.kind === "manual_lunar" ? casting.timeInput.timezone : null,
          calendarPolicyId: casting.calendarPolicyId,
        } satisfies ManualLunarInput)
      : fromGregorian({
          kind: "civil_datetime",
          localDateTime: casting.timeInput.kind === "civil_datetime" ? casting.timeInput.localDateTime : "",
          timezone: casting.timeInput.kind === "civil_datetime" ? casting.timeInput.timezone : "",
          fold: casting.timeInput.kind === "civil_datetime" ? casting.timeInput.fold : null,
          calendarPolicyId: casting.calendarPolicyId,
        } satisfies GregorianDateTimeInput);
    const branch = branchName(normalized.earthlyBranch);
    const manual = normalized.source === "manual_lunar";
    const calendar: CalendarResult = {
      calendarPolicyId: normalized.calendarPolicyId,
      localDateTime: normalized.localDateTime ?? null,
      timezone: manual || normalized.timeZone === "manual" ? null : normalized.timeZone,
      resolvedLunarDate: {
        year: normalized.lunarYear ?? null,
        month: normalized.lunarMonth,
        day: normalized.lunarDay,
        isLeapMonth: normalized.isLeapMonth,
      },
      earthlyBranch: branch,
      earthlyBranchIndex: normalized.earthlyBranchIndex,
      boundaryDecision: {
        mode: normalized.calendarPolicyId === "zi-hour-23-reuse-leap-month" ? "zi_hour_23" : "civil_midnight",
        appliedDayOffset: normalized.appliedDayOffset,
        manualInputBypass: manual,
      },
      trace: [
        { stage: "calendar-policy", calendarPolicyId: normalized.calendarPolicyId },
        { stage: "input-mode", source: normalized.source, manualInputBypass: manual },
        {
          stage: "calendar-boundary",
          appliedDayOffset: normalized.appliedDayOffset,
          inputLocalDateTime: normalized.localDateTime ?? null,
          lunarConversionLocalDateTime: normalized.lunarConversionLocalDateTime ?? normalized.localDateTime ?? null,
        },
        { stage: "earthly-branch", earthlyBranch: branch, earthlyBranchIndex: normalized.earthlyBranchIndex },
      ],
      warnings: normalized.warnings,
    };
    const resolvedInput: CalendarResultInput = {
      kind: "calendar",
      inputMode: casting.inputMode,
      timezone: calendar.timezone ?? null,
      localDateTime: calendar.localDateTime ?? null,
      lunarMonth: normalized.lunarMonth,
      lunarDay: normalized.lunarDay,
      isLeapMonth: normalized.isLeapMonth,
      earthlyBranch: branch,
      earthlyBranchIndex: normalized.earthlyBranchIndex,
      domainId: context.domainId,
      stageId: context.stageId,
      questionFlags: context.flags,
      privacy: {
        questionTextStored: false,
        questionTextIncludedInExport: false,
      },
    };
    return {
      casting: {
        kind: "calendar",
        inputMode: casting.inputMode,
        calendarPolicyId: casting.calendarPolicyId,
      },
      input: resolvedInput,
      calendar,
      calculationInput: {
        kind: "calendar",
        lunarMonth: normalized.lunarMonth,
        lunarDay: normalized.lunarDay,
        earthlyBranchIndex: normalized.earthlyBranchIndex,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message = error instanceof Error ? error.message : "Calendar normalization failed";
    throw new AppError("CALENDAR_ERROR", message);
  }
}

function interpret(input: {
  readonly resolvedInput: ResultInput;
  readonly calculation: CalculationResult;
}): InterpretationResult {
  const selection = selectInterpretation({
    finalPalaceId: input.calculation.finalPalaceId,
    domainId: input.resolvedInput.domainId,
    stageId: input.resolvedInput.stageId,
  });
  return {
    domainId: input.resolvedInput.domainId,
    stageId: input.resolvedInput.stageId,
    certaintyMode: "symbolic-non-deterministic",
    sections: selection.sections,
    fragmentIds: selection.fragmentIds,
    candidateClaimIds: selection.candidateClaims.map((claim) => claim.id),
    candidateClaims: selection.candidateClaims,
    selectedFragments: selection.selectedFragments,
    trace: selection.trace,
  };
}

function textMessageBlocks(
  rawSafetyMessages: JsonObject,
  kind: "conclusions" | "realityActions" | "contexts",
  ids: readonly string[],
): readonly ContentBlock[] {
  const entries = rawSafetyMessages[kind];
  if (!Array.isArray(entries)) return [];
  const selected = new Set(ids);
  return entries.flatMap((entry) => {
    const message = jsonObject(entry, `safetyMessages.${kind}`);
    const id = typeof message.id === "string" ? message.id : null;
    const text = typeof message.text === "string" ? message.text : null;
    if (id === null || text === null || !selected.has(id)) return [];
    return [{ id: `safety.${kind}.${id}`, text, kind: "safety_message", status: "provisional", sourceIds: [] } satisfies ContentBlock];
  });
}

function ethicsResult(
  context: RuntimeQuestionContext,
  resolvedInput: ResultInput,
  calculation: CalculationResult,
  interpretation: InterpretationResult,
): EthicsResult {
  const rawRules = jsonObject(ethicsRulesJson, "ethicsRules");
  const rawSafetyMessages = jsonObject(safetyMessagesJson, "safetyMessages");
  const rules = jsonRecords(rawRules.rules, "ethicsRules.rules");
  const safetyMessages: Record<string, unknown> = { ...rawSafetyMessages };
  const candidateClaims = interpretation.candidateClaims ?? [];
  const selectedFragments = interpretation.selectedFragments ?? [];
  const engineInput = {
    domainId: resolvedInput.domainId,
    stageId: resolvedInput.stageId,
    questionContext: {
      facts: context.facts,
      flags: context.flags,
    },
    candidateClaims: candidateClaims.map((claim) => ({
      id: claim.id,
      type: claim.claimType,
      fragmentId: claim.fragmentIds[0] ?? null,
      tags: claim.tags,
    })),
    selectedFragments,
    rules,
    safetyMessages,
    finalPalaceIdBefore: calculation.finalPalaceId,
    finalPalaceIdAfter: calculation.finalPalaceId,
    identityFieldsChanged: false,
  };
  let raw: RawEthicsResult;
  try {
    raw = evaluateEthics(engineInput);
    assertFinalPalaceInvariant(calculation.finalPalaceId, calculation.finalPalaceId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message = error instanceof Error ? error.message : "Ethics evaluation failed";
    throw new AppError("ETHICS_ERROR", message, { recoverable: false });
  }
  const claimById = new Map(candidateClaims.map((claim) => [claim.id, claim]));
  const suppressedClaims = raw.suppressedClaims.map((suppressed) => {
    const claim = claimById.get(suppressed.claimId);
    return {
      claimId: suppressed.claimId,
      claimType: claim?.claimType ?? suppressed.reason.replace("claim_type:", ""),
      ruleId: suppressed.ruleId,
      fragmentIds: claim?.fragmentIds ?? (suppressed.originalFragmentId ? [suppressed.originalFragmentId] : []),
      reasonCode: suppressed.reason,
    };
  });
  const controlledMessages = [
    ...raw.requiredNotices.map((text, index) => ({
      id: `safety.rule-notice.${index + 1}`,
      text,
      kind: "safety_rule_notice",
      status: "provisional",
      sourceIds: [],
    } satisfies ContentBlock)),
    ...textMessageBlocks(rawSafetyMessages, "conclusions", raw.forcedConclusionCodes),
    ...textMessageBlocks(rawSafetyMessages, "realityActions", raw.requiredRealityActionCodes),
    ...textMessageBlocks(rawSafetyMessages, "contexts", raw.contextCodes),
  ];
  const requiredNotices = [...new Set([
    ...raw.requiredNotices,
    ...controlledMessages.map((message) => message.text),
  ])];
  return {
    mode: raw.mode,
    evaluatedRuleIds: rules.flatMap((rule) => typeof rule.id === "string" ? [rule.id] : []),
    triggeredRuleIds: raw.triggeredRuleIds,
    retainedClaimIds: raw.retainedClaims.map((claim) => claim.id),
    suppressedClaims,
    retainedFragmentIds: raw.retainedFragmentIds,
    blockedFragmentIds: raw.blockedFragmentIds,
    forcedConclusionCodes: raw.forcedConclusionCodes,
    requiredNotices,
    requiredRealityActionCodes: raw.requiredRealityActionCodes,
    contextCodes: raw.contextCodes,
    allowedTopics: raw.allowedTopics,
    forbiddenActionTypes: raw.forbiddenActionTypes,
    preferredTerms: raw.preferredTerms,
    forbiddenTerms: raw.forbiddenTerms,
    stopPrimaryDivination: raw.mode === "hard_stop",
    trace: raw.trace,
  };
}

const DISPLAY_SECTION_KEYS = [
  "neutral",
  "domain",
  "stage",
  "actions",
  "traditionalText",
  "historicalContext",
  "realityChecks",
] as const satisfies readonly (keyof InterpretationSections)[];

function present(input: {
  readonly request: DivinationRequest;
  readonly resolvedInput: ResultInput;
  readonly calendar: CalendarResult;
  readonly calculation: CalculationResult;
  readonly interpretation: InterpretationResult;
  readonly ethics: EthicsResult;
}): { readonly interpretation: InterpretationResult; readonly ethics: EthicsResult } {
  const candidateClaims = input.interpretation.candidateClaims ?? [];
  const suppressedClaimIds = new Set(input.ethics.suppressedClaims.map((claim) => claim.claimId));
  const suppressedClaimTexts = new Set(
    candidateClaims
      .filter((claim) => suppressedClaimIds.has(claim.id))
      .map((claim) => claim.text),
  );
  const hiddenFragmentIds = new Set([
    ...input.ethics.blockedFragmentIds,
    ...input.ethics.suppressedClaims.flatMap((claim) => claim.fragmentIds),
  ]);
  const hardStop = input.ethics.stopPrimaryDivination;
  const filterBlocks = (blocks: readonly ContentBlock[]): readonly ContentBlock[] => hardStop
    ? []
    : blocks.filter((block) => !hiddenFragmentIds.has(block.id) && !suppressedClaimTexts.has(block.text));
  const sections: InterpretationSections = {
    neutral: filterBlocks(input.interpretation.sections.neutral),
    domain: filterBlocks(input.interpretation.sections.domain),
    stage: filterBlocks(input.interpretation.sections.stage),
    actions: filterBlocks(input.interpretation.sections.actions),
    traditionalText: filterBlocks(input.interpretation.sections.traditionalText),
    historicalContext: filterBlocks(input.interpretation.sections.historicalContext),
    realityChecks: filterBlocks(input.interpretation.sections.realityChecks),
    ethicsNotices: [],
  };
  const displayedBlockIds = new Set(
    DISPLAY_SECTION_KEYS.flatMap((key) => sections[key].map((block) => block.id)),
  );
  const retainedFragmentIds = [...new Set([
    ...input.ethics.retainedFragmentIds.filter((id) => displayedBlockIds.has(id)),
    ...[...displayedBlockIds],
  ])];
  const retainedFragmentSet = new Set(retainedFragmentIds);
  const retainedClaimIds = input.ethics.retainedClaimIds.filter((claimId) => {
    const claim = candidateClaims.find((candidate) => candidate.id === claimId);
    return claim !== undefined
      && !suppressedClaimIds.has(claim.id)
      && !suppressedClaimTexts.has(claim.text)
      && claim.fragmentIds.some((fragmentId) => retainedFragmentSet.has(fragmentId));
  });
  return {
    interpretation: {
      domainId: input.interpretation.domainId,
      stageId: input.interpretation.stageId,
      certaintyMode: input.interpretation.certaintyMode,
      sections,
      fragmentIds: retainedFragmentIds,
      candidateClaimIds: retainedClaimIds,
      trace: input.interpretation.trace,
    },
    ethics: {
      ...input.ethics,
      retainedClaimIds,
      retainedFragmentIds,
    },
  };
}

function provenance(input: {
  readonly request: DivinationRequest;
  readonly resolvedInput: ResultInput;
  readonly calculation: CalculationResult;
  readonly interpretation: InterpretationResult;
  readonly ethics: EthicsResult;
}): Provenance {
  const interpretationSections: readonly (readonly ContentBlock[])[] = [
    input.interpretation.sections.neutral,
    input.interpretation.sections.domain,
    input.interpretation.sections.stage,
    input.interpretation.sections.actions,
    input.interpretation.sections.traditionalText,
    input.interpretation.sections.historicalContext,
    input.interpretation.sections.realityChecks,
    input.interpretation.sections.ethicsNotices,
  ];
  const displayedSourceIds = interpretationSections.flatMap((blocks) => blocks.flatMap((block) => block.sourceIds));
  const contextSourceIds = getContextSourceIds({
    finalPalaceId: input.calculation.finalPalaceId,
    domainId: input.resolvedInput.domainId,
    stageId: input.resolvedInput.stageId,
  });
  const sourceIds = [...new Set([...displayedSourceIds, ...contextSourceIds])];
  const sources = getSources(sourceIds);
  const ruleVersion = getEthicsRulesVersion();
  const manifest = getKnowledgeManifest();
  const palace = getPalace(input.calculation.finalPalaceId);
  return {
    knowledgeVersion: getKnowledgeVersion(),
    ruleVersion,
    schemaVersions: {
      request: input.request.requestVersion,
      result: "1.2.0",
      calendar: input.request.casting.kind === "calendar" ? "1.0.0" : "not-applicable",
      ethics: ruleVersion,
      palaces: manifest.palacesVersion,
      questionDomains: manifest.questionDomainsVersion,
      interpretationFragments: manifest.interpretationFragmentsVersion,
      sourceRegistry: manifest.sourceRegistryVersion,
      safetyMessages: manifest.safetyMessagesVersion,
    },
    sourceIds,
    provisionalSourceIds: sources.filter(isProvisionalSource).map((source) => source.id),
    disputedFieldIds: palace.disputedFieldIds,
    calendarPolicyId: input.request.casting.kind === "calendar" ? input.request.casting.calendarPolicyId : null,
    algorithmId: input.calculation.algorithmId,
    fragmentIds: input.interpretation.fragmentIds,
    ethicsRuleIds: input.ethics.triggeredRuleIds,
  };
}

function dependencies(): DivinationDependencies {
  return {
    calendar: {
      async resolve(request): Promise<CalendarResolution> {
        return resolveCasting(request, contextFor(request));
      },
    },
    calculation: { calculate },
    interpretation: {
      async interpret(input): Promise<InterpretationResult> {
        return interpret({ resolvedInput: input.resolvedInput, calculation: input.calculation });
      },
    },
    ethics: {
      async evaluate(input): Promise<EthicsResult> {
        return ethicsResult(contextFor(input.request), input.resolvedInput, input.calculation, input.interpretation);
      },
    },
    presentation: { present },
    provenance: {
      create: provenance,
    },
  };
}

export function createLocalDivinationService(): DivinationService {
  return createDivinationService(dependencies());
}

export const localDivinationService = createLocalDivinationService();

export function runLocalDivination(request: DivinationRequest): Promise<DivinationResult> {
  return localDivinationService.runDivination(request);
}
