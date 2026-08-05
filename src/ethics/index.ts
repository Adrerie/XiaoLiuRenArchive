/**
 * Typed-app entry point for the local ethics engine.
 * The implementation is intentionally dependency-free ESM so the same
 * evaluator can be exercised directly with Node's built-in test runner.
 */
// @ts-expect-error The implementation is a local .mjs module; runtime bundlers resolve it directly.
export { EthicsEngineError, assertFinalPalaceInvariant, evaluateEthics } from "./engine.mjs";
