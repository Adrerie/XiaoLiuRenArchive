# Task: architecture-agent

## Mission

建立 R1 Local Web MVP 的工程骨架、共享类型、模块依赖和整合边界。你负责让其他子代理能够并行工作，但无权修改传统算法或知识内容。

## Required Reading

- `README.md`
- `AGENTS.md`
- `CODEX_MASTER_PROMPT.md`
- `docs/01-system-architecture.md`
- `docs/10-product-requirements.md`
- `docs/11-ui-information-architecture.md`
- `algorithm/contract.md`
- `algorithm/interpretation-engine-contract.md`
- `algorithm/ethics-engine-contract.md`
- `codex/batch-04-implementation-plan.md`
- `codex/batch-04-acceptance-criteria.md`

## Allowed Areas

Primary ownership:

- `package.json`
- TypeScript, Vite, Vitest and lint configuration
- `.github/workflows/**`
- `src/app/**`
- `src/shared/**`
- `src/types/**`
- integration service boundary
- architecture ADRs created during implementation

Shared files require controller coordination.

## Forbidden Areas

Do not change without explicit controller approval:

- `algorithm/contract.md`
- `algorithm/test-vectors.v1.json`
- traditional fields in `knowledge/palaces.v1.json`
- ethics policy semantics
- calendar policy meaning

Do not write an alternative palace calculation in the app service or UI.

## Deliverables

1. React + TypeScript strict + Vite scaffold.
2. Vitest and Node test environments.
3. Draft 2020-12 JSON Schema validation dependency.
4. Shared interfaces for request, calculation, interpretation, ethics and result.
5. Module dependency rules.
6. One high-level `runDivination` service interface.
7. Basic CI for validation, tests and build.
8. Local-only dependency inventory.
9. Architecture report and dependency diagram.

## Required Dependency Direction

```text
shared types
   ↑
calendar     core
   \         /
 application service
   ↑       ↑
knowledge  ethics
   \       /
 interpretation
      ↑
   frontend
```

The exact drawing may differ, but these prohibitions are mandatory:

- core must not import frontend, knowledge, ethics or calendar conversion
- calendar must not import interpretation
- knowledge data must not import UI
- frontend must not import raw algorithm constants to recalculate results
- ethics must not mutate core results

## Shared Type Freeze

Before other agents integrate, publish interfaces for:

- `DivinationRequest`
- `QuestionContext`
- `NormalizedLunarInput`
- `CalculationResult`
- `InterpretationDraft`
- `CandidateClaim`
- `EthicsEvaluationResult`
- `DivinationResult`
- typed error union

Generate or manually mirror types from schemas only if consistency tests are added.

## Tests to Run

At minimum:

```bash
npm run typecheck
npm test
npm run build
```

Also verify a dependency scan or lint rule catches forbidden imports.

## Completion Report

Include:

- directory tree
- dependency decisions
- files changed
- commands actually run
- results
- shared interfaces frozen
- unresolved integration questions
- confirmation that no algorithm semantics were changed
