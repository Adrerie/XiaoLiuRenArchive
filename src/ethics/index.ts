/**
 * Typed-app entry point for the local ethics engine.
 * The implementation is intentionally dependency-free ESM so the same
 * evaluator can be exercised directly with Node's built-in test runner.
 */
export { EthicsEngineError, assertFinalPalaceInvariant, evaluateEthics } from "./engine.mjs";
export type {
  RawEthicsClaim,
  RawEthicsFragment,
  RawEthicsInput,
  RawEthicsResult,
  RawSuppressedClaim,
} from "./engine.mjs";
