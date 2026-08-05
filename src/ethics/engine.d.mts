export interface RawEthicsClaim {
  readonly id: string;
  readonly type: string;
  readonly fragmentId?: string | null;
  readonly sourceFragmentId?: string | null;
  readonly tags?: readonly string[];
}

export interface RawEthicsFragment {
  readonly id: string;
  readonly tags?: readonly string[];
}

export interface RawEthicsInput {
  readonly domainId: string;
  readonly stageId: string | null;
  readonly questionContext: {
    readonly facts: Readonly<Record<string, boolean | number | string | null>>;
    readonly flags: readonly string[];
    readonly [key: string]: unknown;
  };
  readonly candidateClaims: readonly RawEthicsClaim[];
  readonly selectedFragments: readonly RawEthicsFragment[];
  readonly rules: readonly Record<string, unknown>[];
  readonly safetyMessages: Record<string, unknown>;
  readonly finalPalaceIdBefore: string;
  readonly finalPalaceIdAfter: string;
  readonly identityFieldsChanged?: boolean;
}

export interface RawSuppressedClaim {
  readonly claimId: string;
  readonly ruleId: string;
  readonly originalFragmentId?: string | null;
  readonly reason: string;
}

export interface RawEthicsResult {
  readonly mode: "allow" | "allow_with_constraints" | "hard_block" | "hard_stop";
  readonly triggeredRuleIds: readonly string[];
  readonly retainedClaims: readonly RawEthicsClaim[];
  readonly suppressedClaims: readonly RawSuppressedClaim[];
  readonly retainedFragmentIds: readonly string[];
  readonly blockedFragmentIds: readonly string[];
  readonly forcedConclusionCodes: readonly string[];
  readonly requiredNotices: readonly string[];
  readonly requiredRealityActionCodes: readonly string[];
  readonly contextCodes: readonly string[];
  readonly allowedTopics: readonly string[];
  readonly forbiddenActionTypes: readonly string[];
  readonly preferredTerms: readonly string[];
  readonly forbiddenTerms: readonly string[];
  readonly trace: readonly Record<string, unknown>[];
}

export class EthicsEngineError extends Error {
  readonly code: string;
  readonly details?: unknown;
}

export function evaluateEthics(input: RawEthicsInput): RawEthicsResult;
export function assertFinalPalaceInvariant(beforeFinalPalaceId: string, afterFinalPalaceId: string): true;
