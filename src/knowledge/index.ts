import palacesJson from "../../knowledge/palaces.v1.json";
import domainsJson from "../../knowledge/question-domains.v1.json";
import fragmentsJson from "../../knowledge/interpretation-fragments.v1.json";
import sourcesJson from "../../knowledge/source-registry.json";
import type {
  CandidateClaim,
  ContentBlock,
  InterpretationSections,
  PalaceId,
  SelectedFragment,
} from "../shared";

const PALACE_ORDER = [
  "da_an",
  "liu_lian",
  "su_xi",
  "chi_kou",
  "xiao_ji",
  "kong_wang",
] as const satisfies readonly PalaceId[];

type RawRecord = Readonly<Record<string, unknown>>;
type FragmentKind =
  | "neutral_summary"
  | "action_prompt"
  | "reality_check"
  | "stage_modifier"
  | "ethics_notice"
  | "historical_context";

export interface KnowledgeDomain {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly stages: readonly string[];
  readonly palaceInterpretations: Readonly<Record<string, DomainPalaceInterpretation>>;
}

export interface DomainPalaceInterpretation {
  readonly summary: string;
  readonly supportive: string;
  readonly caution: string;
  readonly actionPrompts: readonly string[];
}

export interface KnowledgeSource {
  readonly id: string;
  readonly title: string;
  readonly verificationStatus: string;
  readonly url: string | null;
}

export interface KnowledgeSelection {
  readonly sections: InterpretationSections;
  readonly candidateClaims: readonly CandidateClaim[];
  readonly selectedFragments: readonly SelectedFragment[];
  readonly fragmentIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly trace: readonly Record<string, unknown>[];
}

export class KnowledgeError extends Error {
  readonly code:
    | "KNOWLEDGE_LOAD_ERROR"
    | "KNOWLEDGE_INTEGRITY_ERROR"
    | "KNOWLEDGE_MISSING_REFERENCE";

  constructor(code: KnowledgeError["code"], message: string) {
    super(message);
    this.name = "KnowledgeError";
    this.code = code;
  }
}

interface PalaceRecord {
  readonly id: PalaceId;
  readonly name: string;
  readonly sourceIds: readonly string[];
  readonly neutralSummary: string;
  readonly traditionalText: string;
  readonly traditionalStatus: ContentBlock["status"];
  readonly traditionalSourceIds: readonly string[];
  readonly realityChecks: readonly string[];
}

interface FragmentRecord {
  readonly id: string;
  readonly kind: FragmentKind;
  readonly text: string;
  readonly palaceIds: readonly (PalaceId | "all")[];
  readonly domainIds: readonly string[];
  readonly stageIds: readonly string[];
  readonly tags: readonly string[];
  readonly claimTypes: readonly string[];
  readonly sourceIds: readonly string[];
  readonly status: ContentBlock["status"];
  readonly priority: number;
  readonly requiresEthicsRuleIds: readonly string[];
}

interface KnowledgeRegistry {
  readonly knowledgeVersion: string;
  readonly palaces: ReadonlyMap<PalaceId, PalaceRecord>;
  readonly domains: ReadonlyMap<string, KnowledgeDomain>;
  readonly fragments: readonly FragmentRecord[];
  readonly sources: ReadonlyMap<string, KnowledgeSource>;
}

const palaceSet = new Set<PalaceId>(PALACE_ORDER);

function record(value: unknown, label: string): RawRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new KnowledgeError("KNOWLEDGE_LOAD_ERROR", `${label} must be an object`);
  }
  return value as RawRecord;
}

function value(recordValue: RawRecord, key: string, label: string): unknown {
  if (!(key in recordValue)) {
    throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `${label}.${key} is required`);
  }
  return recordValue[key];
}

function stringValue(input: unknown, label: string): string {
  if (typeof input !== "string" || input.length === 0) {
    throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `${label} must be a non-empty string`);
  }
  return input;
}

function optionalStringValue(input: unknown): string | null {
  return typeof input === "string" && input.length > 0 ? input : null;
}

function arrayValue(input: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(input)) {
    throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `${label} must be an array`);
  }
  return input;
}

function stringArray(input: unknown, label: string): readonly string[] {
  return arrayValue(input, label).map((item, index) => stringValue(item, `${label}[${index}]`));
}

function palaceId(input: unknown, label: string): PalaceId {
  if (typeof input !== "string" || !palaceSet.has(input as PalaceId)) {
    throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `${label} contains an unknown palace`);
  }
  return input as PalaceId;
}

function statusValue(input: unknown): ContentBlock["status"] {
  if (input === "reviewed" || input === "canonical") return input;
  if (input === "disputed") return "disputed";
  return "provisional";
}

function recordMap(input: unknown, label: string): RawRecord {
  return record(input, label);
}

function parseRegistry(): KnowledgeRegistry {
  const palacesRoot = record(palacesJson, "palaces");
  const domainsRoot = record(domainsJson, "domains");
  const fragmentsRoot = record(fragmentsJson, "fragments");
  const sourcesRoot = record(sourcesJson, "sources");

  const sourceRecords = arrayValue(value(sourcesRoot, "sources", "sources"), "sources.sources");
  const sourceMap = new Map<string, KnowledgeSource>();
  for (const [index, sourceValue] of sourceRecords.entries()) {
    const source = record(sourceValue, `sources.sources[${index}]`);
    const id = stringValue(value(source, "id", `sources.sources[${index}]`), "source.id");
    sourceMap.set(id, {
      id,
      title: stringValue(value(source, "title", `source ${id}`), `source ${id}.title`),
      verificationStatus: stringValue(
        value(source, "verificationStatus", `source ${id}`),
        `source ${id}.verificationStatus`,
      ),
      url: optionalStringValue(source.url),
    });
  }

  const parsedPalaces = arrayValue(value(palacesRoot, "palaces", "palaces"), "palaces.palaces");
  const palaceMap = new Map<PalaceId, PalaceRecord>();
  for (const [index, palaceValue] of parsedPalaces.entries()) {
    const palace = record(palaceValue, `palaces.palaces[${index}]`);
    const id = palaceId(value(palace, "id", `palaces.palaces[${index}]`), `palace ${index}.id`);
    const sourceIds = stringArray(value(palace, "sourceIds", `palace ${id}`), `palace ${id}.sourceIds`);
    const classical = recordMap(value(palace, "classical", `palace ${id}`), `palace ${id}.classical`);
    const verse = recordMap(value(classical, "verse", `palace ${id}.classical`), `palace ${id}.verse`);
    const semanticCore = recordMap(value(palace, "semanticCore", `palace ${id}`), `palace ${id}.semanticCore`);
    const modernGeneral = recordMap(value(palace, "modernGeneral", `palace ${id}`), `palace ${id}.modernGeneral`);
    const traditionalSourceIds = stringArray(
      value(verse, "sourceIds", `palace ${id}.classical.verse`),
      `palace ${id}.classical.verse.sourceIds`,
    );
    for (const sourceId of [...sourceIds, ...traditionalSourceIds]) {
      if (!sourceMap.has(sourceId)) {
        throw new KnowledgeError("KNOWLEDGE_MISSING_REFERENCE", `Unknown source reference: ${sourceId}`);
      }
    }
    const checks = modernGeneral.realityChecks;
    palaceMap.set(id, {
      id,
      name: stringValue(value(palace, "name", `palace ${id}`), `palace ${id}.name`),
      sourceIds,
      neutralSummary: stringValue(
        value(semanticCore, "neutralSummary", `palace ${id}.semanticCore`),
        `palace ${id}.neutralSummary`,
      ),
      traditionalText: stringValue(value(verse, "text", `palace ${id}.classical.verse`), `palace ${id}.verse.text`),
      traditionalStatus: statusValue(verse.status),
      traditionalSourceIds,
      realityChecks: checks === undefined ? [] : stringArray(checks, `palace ${id}.modernGeneral.realityChecks`),
    });
  }
  if (palaceMap.size !== PALACE_ORDER.length || PALACE_ORDER.some((id) => !palaceMap.has(id))) {
    throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", "The six palace registry is incomplete");
  }

  const domainRecords = arrayValue(value(domainsRoot, "domains", "domains"), "domains.domains");
  const domainMap = new Map<string, KnowledgeDomain>();
  for (const [index, domainValue] of domainRecords.entries()) {
    const domain = record(domainValue, `domains.domains[${index}]`);
    const id = stringValue(value(domain, "id", `domain ${index}`), `domain ${index}.id`);
    const interpretations = recordMap(
      value(domain, "palaceInterpretations", `domain ${id}`),
      `domain ${id}.palaceInterpretations`,
    );
    const parsedInterpretations: Record<string, DomainPalaceInterpretation> = {};
    for (const palace of PALACE_ORDER) {
      const interpretation = recordMap(interpretations[palace], `domain ${id}.${palace}`);
      parsedInterpretations[palace] = {
        summary: stringValue(interpretation.summary, `domain ${id}.${palace}.summary`),
        supportive: stringValue(interpretation.supportive, `domain ${id}.${palace}.supportive`),
        caution: stringValue(interpretation.caution, `domain ${id}.${palace}.caution`),
        actionPrompts: stringArray(interpretation.actionPrompts, `domain ${id}.${palace}.actionPrompts`),
      };
    }
    domainMap.set(id, {
      id,
      name: stringValue(value(domain, "name", `domain ${id}`), `domain ${id}.name`),
      description: stringValue(value(domain, "description", `domain ${id}`), `domain ${id}.description`),
      stages: domain.stages === undefined ? [] : stringArray(domain.stages, `domain ${id}.stages`),
      palaceInterpretations: parsedInterpretations,
    });
  }

  const fragmentRecords = arrayValue(value(fragmentsRoot, "fragments", "fragments"), "fragments.fragments");
  const fragments: FragmentRecord[] = [];
  for (const [index, fragmentValue] of fragmentRecords.entries()) {
    const fragment = record(fragmentValue, `fragments.fragments[${index}]`);
    const id = stringValue(value(fragment, "id", `fragment ${index}`), `fragment ${index}.id`);
    const kind = stringValue(value(fragment, "kind", `fragment ${id}`), `fragment ${id}.kind`);
    if (!["neutral_summary", "action_prompt", "reality_check", "stage_modifier", "ethics_notice", "historical_context"].includes(kind)) {
      throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `Unknown fragment kind: ${kind}`);
    }
    const sourceIds = stringArray(value(fragment, "sourceIds", `fragment ${id}`), `fragment ${id}.sourceIds`);
    for (const sourceId of sourceIds) {
      if (!sourceMap.has(sourceId)) {
        throw new KnowledgeError("KNOWLEDGE_MISSING_REFERENCE", `Unknown source reference: ${sourceId}`);
      }
    }
    const palaceIds = arrayValue(value(fragment, "palaceIds", `fragment ${id}`), `fragment ${id}.palaceIds`).map((item, itemIndex) => {
      if (item === "all") return item;
      return palaceId(item, `fragment ${id}.palaceIds[${itemIndex}]`);
    });
    const priorityValue = fragment.priority;
    if (typeof priorityValue !== "number" || !Number.isFinite(priorityValue)) {
      throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `fragment ${id}.priority must be finite`);
    }
    fragments.push({
      id,
      kind: kind as FragmentKind,
      text: stringValue(value(fragment, "text", `fragment ${id}`), `fragment ${id}.text`),
      palaceIds,
      domainIds: stringArray(value(fragment, "domainIds", `fragment ${id}`), `fragment ${id}.domainIds`),
      stageIds: stringArray(value(fragment, "stageIds", `fragment ${id}`), `fragment ${id}.stageIds`),
      tags: stringArray(value(fragment, "tags", `fragment ${id}`), `fragment ${id}.tags`),
      claimTypes: stringArray(value(fragment, "claimTypes", `fragment ${id}`), `fragment ${id}.claimTypes`),
      sourceIds,
      status: statusValue(fragment.status),
      priority: priorityValue,
      requiresEthicsRuleIds: fragment.requiresEthicsRuleIds === undefined
        ? []
        : stringArray(fragment.requiresEthicsRuleIds, `fragment ${id}.requiresEthicsRuleIds`),
    });
  }

  return {
    knowledgeVersion: stringValue(palacesRoot.knowledgeVersion, "palaces.knowledgeVersion"),
    palaces: palaceMap,
    domains: domainMap,
    fragments,
    sources: sourceMap,
  };
}

const registry = parseRegistry();

function sortAndDedupe<T extends { readonly id: string; readonly priority?: number }>(items: readonly T[]): readonly T[] {
  const uniqueItems = new Map<string, T>();
  for (const item of items) uniqueItems.set(item.id, item);
  return [...uniqueItems.values()].sort((left, right) => {
    const priorityDifference = (right.priority ?? 0) - (left.priority ?? 0);
    return priorityDifference === 0 ? left.id.localeCompare(right.id) : priorityDifference;
  });
}

function block(id: string, text: string, kind: string, status: ContentBlock["status"], sourceIds: readonly string[]): ContentBlock {
  return { id, text, kind, status, sourceIds: [...new Set(sourceIds)] };
}

function includesPalace(fragment: FragmentRecord, finalPalaceId: PalaceId): boolean {
  return fragment.palaceIds.includes("all") || fragment.palaceIds.includes(finalPalaceId);
}

function matchingFragments(kind: FragmentKind, finalPalaceId: PalaceId, domainId: string, stageId: string | null): readonly FragmentRecord[] {
  return sortAndDedupe(registry.fragments.filter((fragment) => {
    if (fragment.kind !== kind || !includesPalace(fragment, finalPalaceId)) return false;
    if (fragment.domainIds.length > 0 && !fragment.domainIds.includes(domainId)) return false;
    if (fragment.stageIds.length > 0 && (!stageId || !fragment.stageIds.includes(stageId))) return false;
    return true;
  }));
}

function addFragments(selected: FragmentRecord[], candidates: readonly FragmentRecord[]): void {
  for (const candidate of candidates) {
    if (!selected.some((fragment) => fragment.id === candidate.id)) selected.push(candidate);
  }
}

export function getKnowledgeVersion(): string {
  return registry.knowledgeVersion;
}

export function listPalaces(): readonly PalaceRecord[] {
  return PALACE_ORDER.map((id) => registry.palaces.get(id)).filter((palace): palace is PalaceRecord => palace !== undefined);
}

export function listDomains(): readonly KnowledgeDomain[] {
  return [...registry.domains.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function listStages(domainId: string): readonly string[] {
  const domain = registry.domains.get(domainId);
  if (!domain) throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `Unknown domain: ${domainId}`);
  return domain.stages;
}

export function getSources(sourceIds: readonly string[]): readonly KnowledgeSource[] {
  return [...new Set(sourceIds)].map((sourceId) => {
    const source = registry.sources.get(sourceId);
    if (!source) throw new KnowledgeError("KNOWLEDGE_MISSING_REFERENCE", `Unknown source reference: ${sourceId}`);
    return source;
  });
}

export function selectInterpretation(input: {
  readonly finalPalaceId: PalaceId;
  readonly domainId: string;
  readonly stageId: string | null;
}): KnowledgeSelection {
  const palace = registry.palaces.get(input.finalPalaceId);
  const domain = registry.domains.get(input.domainId);
  if (!palace || !domain) {
    throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", "The selected palace or domain is not registered");
  }
  if (input.stageId !== null && !domain.stages.includes(input.stageId)) {
    throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `Stage ${input.stageId} is not valid for ${input.domainId}`);
  }

  const neutralFragments = matchingFragments("neutral_summary", input.finalPalaceId, input.domainId, input.stageId);
  if (neutralFragments.length !== 1) {
    throw new KnowledgeError("KNOWLEDGE_INTEGRITY_ERROR", `Expected exactly one neutral fragment for ${input.finalPalaceId}`);
  }
  const neutral = neutralFragments[0];
  const domainReading = domain.palaceInterpretations[input.finalPalaceId];
  const domainBlocks = [
    block(`${input.domainId}.${input.finalPalaceId}.summary`, domainReading.summary, "domain_summary", "provisional", palace.sourceIds),
    block(`${input.domainId}.${input.finalPalaceId}.supportive`, domainReading.supportive, "domain_supportive", "provisional", palace.sourceIds),
    block(`${input.domainId}.${input.finalPalaceId}.caution`, domainReading.caution, "domain_caution", "provisional", palace.sourceIds),
  ];
  const stageFragments = matchingFragments("stage_modifier", input.finalPalaceId, input.domainId, input.stageId);
  const actionFragments = matchingFragments("action_prompt", input.finalPalaceId, input.domainId, input.stageId);
  const realityFragments = matchingFragments("reality_check", input.finalPalaceId, input.domainId, input.stageId);
  const historicalFragments = matchingFragments("historical_context", input.finalPalaceId, input.domainId, input.stageId);
  const ethicsFragments = matchingFragments("ethics_notice", input.finalPalaceId, input.domainId, input.stageId);

  const selected: FragmentRecord[] = [];
  addFragments(selected, [neutral, ...stageFragments, ...actionFragments, ...realityFragments, ...historicalFragments, ...ethicsFragments]);

  const actions = [
    ...actionFragments.map((fragment) => block(fragment.id, fragment.text, fragment.kind, fragment.status, fragment.sourceIds)),
    ...domainReading.actionPrompts.map((text, index) => block(`${input.domainId}.${input.finalPalaceId}.action.${index + 1}`, text, "domain_action", "provisional", palace.sourceIds)),
  ];
  const sections: InterpretationSections = {
    neutral: [block(neutral.id, neutral.text, neutral.kind, neutral.status, [...neutral.sourceIds, ...palace.sourceIds])],
    domain: domainBlocks,
    stage: stageFragments.map((fragment) => block(fragment.id, fragment.text, fragment.kind, fragment.status, fragment.sourceIds)),
    actions,
    traditionalText: [block(`palace.${palace.id}.traditional`, palace.traditionalText, "traditional_text", palace.traditionalStatus, palace.traditionalSourceIds)],
    historicalContext: historicalFragments.map((fragment) => block(fragment.id, fragment.text, fragment.kind, fragment.status, fragment.sourceIds)),
    realityChecks: [
      ...realityFragments.map((fragment) => block(fragment.id, fragment.text, fragment.kind, fragment.status, fragment.sourceIds)),
      ...palace.realityChecks.map((text, index) => block(`palace.${palace.id}.reality.${index + 1}`, text, "reality_check", "provisional", palace.sourceIds)),
    ],
    ethicsNotices: ethicsFragments.map((fragment) => block(fragment.id, fragment.text, fragment.kind, fragment.status, fragment.sourceIds)),
  };

  const candidateClaims: CandidateClaim[] = [];
  for (const fragment of selected) {
    for (const claimType of fragment.claimTypes) {
      candidateClaims.push({
        id: `${fragment.id}.${claimType}`,
        claimType,
        sourceKind: fragment.kind === "historical_context" ? "historical_text" : fragment.kind === "stage_modifier" ? "stage" : fragment.kind === "neutral_summary" ? "palace" : "domain",
        fragmentIds: [fragment.id],
        text: fragment.text,
        certainty: "tentative",
        tags: fragment.tags,
      });
    }
  }
  const selectedFragments: SelectedFragment[] = selected.map((fragment) => ({ id: fragment.id, tags: fragment.tags }));
  const sourceIds = [
    ...palace.sourceIds,
    ...palace.traditionalSourceIds,
    ...selected.flatMap((fragment) => fragment.sourceIds),
  ];
  return {
    sections,
    candidateClaims,
    selectedFragments,
    fragmentIds: [...new Set([...selected.map((fragment) => fragment.id), ...Object.values(sections).flat().map((item) => item.id)])],
    sourceIds: [...new Set(sourceIds)],
    trace: [{ stage: "neutral", fragmentIds: [neutral.id] }, { stage: "domain", domainId: input.domainId }, { stage: "stage", stageId: input.stageId }],
  };
}
