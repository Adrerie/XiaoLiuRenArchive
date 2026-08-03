# Batch 04 Implementation Plan

Status: final planning batch before code implementation.

Batch 04 closes the remaining ambiguity between the foundation knowledge files and the first local Web MVP. After this batch is approved, planning must stop and implementation must begin.

## 1. Objective

Create a deterministic, offline-capable minimum vertical slice that validates the full path:

```text
validated request
→ calendar normalization
→ frozen traditional calculation
→ local knowledge lookup
→ interpretation assembly
→ ethics evaluation
→ structured result
→ accessible UI
→ audit tests
```

## 2. Required Reading Order

The controller and every relevant subagent must read, in order:

1. `README.md`
2. `AGENTS.md`
3. `CODEX_MASTER_PROMPT.md`
4. `docs/10-product-requirements.md`
5. `docs/11-ui-information-architecture.md`
6. `algorithm/contract.md`
7. `algorithm/interpretation-engine-contract.md`
8. `algorithm/ethics-engine-contract.md`
9. `algorithm/rule-conflict-examples.v1.json`
10. `knowledge/divination-request.schema.json`
11. `knowledge/question-context.schema.json`
12. `knowledge/divination-result.schema.json`
13. `fixtures/interpretation-golden-cases.v1.json`
14. `fixtures/ethics-red-team-cases.v1.json`
15. `codex/orchestration.md`
16. The relevant `codex/tasks/*.md` file for each subagent
17. `codex/batch-04-acceptance-criteria.md`

Existing Batch 02 and Batch 03 files remain binding unless Batch 04 explicitly narrows or clarifies them.

## 3. Workstreams

### Workstream A: Architecture and Tooling

Owner: `architecture-agent`

Deliver:

- React + TypeScript strict + Vite
- Vitest
- JSON Schema validator using Draft 2020-12
- ESLint or equivalent static analysis
- local-only dependency policy
- application service boundary
- module aliases only if clearly documented
- basic CI workflow

Do not add Capacitor in the first pass unless the Web MVP is complete and tests are green.

### Workstream B: Knowledge Validation

Owner: `knowledge-agent`, reviewed by `data-validation-agent` or `test-audit-agent`

Deliver:

- schema validation command
- reference integrity command
- unique ID checks
- palace order check
- default calendar policy check
- fixture schema validation
- text audit command for prohibited certainty language in modern fields

The validation commands must run in Node without browser APIs.

### Workstream C: Calendar Adapter

Owner: `calendar-agent`

Deliver:

- manual lunar input adapter first
- civil datetime adapter second
- IANA timezone handling
- earthly branch mapping
- policy-driven midnight behavior
- leap month handling
- structured calendar errors

The manual lunar path must not depend on the civil date conversion library.

### Workstream D: Frozen Core

Owner: `core-algorithm-agent`

Deliver:

- palace constants
- positive modulo
- month, day and hour calculation
- full trace
- normalized input validation
- vector tests
- exhaustive mathematical property tests

No identity, question or domain field may appear in the core API.

### Workstream E: Interpretation Engine

Owner: `knowledge-agent` or dedicated `interpretation-agent` if the controller creates one

Deliver:

- immutable knowledge bundle loader
- palace neutral selection
- domain block selection
- stage modifier selection
- fragment sorting and deduplication
- candidate claim extraction
- source trace
- fail-closed behavior

No freeform text generation is permitted.

### Workstream F: Ethics Engine

Owner: `ethics-agent`

Deliver:

- condition evaluator
- effect executor
- stable rule ordering
- severity merge
- claim suppression
- fragment blocking
- forced conclusion codes
- reality action codes
- hard-stop output mode
- invariant that palace is unchanged

### Workstream G: Application Service

Owner: `architecture-agent` with integration support

Deliver one high-level service:

```ts
runDivination(request: DivinationRequest): DivinationResult
```

Internally it may be async if civil calendar conversion requires lazy loading, but the manual lunar path should remain deterministic and locally testable.

### Workstream H: Frontend

Owner: `frontend-agent`

Deliver:

- request form
- manual lunar path
- one civil datetime path if calendar adapter is ready
- domain and stage selection
- reality fact confirmation
- privacy defaults
- review step
- result overview
- calculation trace
- modern interpretation
- traditional text and source display
- hard-stop banner
- provenance drawer
- palace library basic page

UI must consume application service output only. It must not recalculate palaces.

### Workstream I: Independent Audit

Owner: `test-audit-agent`

Deliver independent test and review report covering:

- all commands actually run
- algorithm vectors
- exhaustive properties
- request and result schemas
- fixture validation
- golden cases
- red-team cases
- identity invariance
- offline and network dependency scan
- source and rule trace
- UI does not contain duplicate algorithm

## 4. Suggested Integration Order

```text
1. project shell
2. schemas and validation
3. core algorithm
4. manual lunar adapter
5. knowledge loader
6. interpretation engine
7. ethics engine
8. application service
9. golden and red-team tests
10. frontend
11. civil datetime adapter
12. full audit
```

The frontend may build static layout in parallel after shared result types are frozen, but may not invent placeholder calculation logic.

## 5. Shared Type Freeze

The architecture agent must first define shared interfaces for:

- `DivinationRequest`
- `QuestionContext`
- `NormalizedLunarInput`
- `CalculationResult`
- `CandidateClaim`
- `InterpretationDraft`
- `EthicsEvaluationResult`
- `DivinationResult`
- error union types

Any later breaking change requires controller approval and notification to all dependent agents.

## 6. Branch and Worktree Plan

Recommended branches:

```text
feature/project-shell
feature/knowledge-validation
feature/calendar-engine
feature/core-divination
feature/interpretation-engine
feature/ethics-engine
feature/frontend
feature/testing-audit
integration/r1-mvp
```

Each agent should use its own worktree. The controller integrates into `integration/r1-mvp` and opens one reviewable PR to `main` after audit.

## 7. Mandatory Commands

The final implementation should expose at least:

```bash
npm run dev
npm run build
npm test
npm run test:core
npm run test:ethics
npm run test:fixtures
npm run validate:knowledge
npm run validate:references
npm run audit:text
npm run audit:network
```

Names may vary only if README and completion report are updated consistently.

## 8. First Milestone Deliverable

The first milestone is complete when a user can:

1. open the local Web app
2. choose manual lunar input
3. enter month, day and hour
4. select a question domain
5. confirm relevant reality facts
6. submit the request
7. see the correct palace and trace
8. see local structured interpretation
9. see mandatory ethics notices
10. inspect sources and provenance

## 9. Explicit Non-Goals During Implementation

Do not spend time on:

- elaborate animation
- AI chat
- remote accounts
- cloud history
- social sharing
- payment
- astrology or other divination systems
- Android release pipeline
- full PDF export
- automatic natural-language question classification beyond optional local keyword suggestions

## 10. Controller Completion Report

The controller must report:

- agents actually created
- worktrees and branches used
- files changed by each agent
- shared contract changes
- commands actually run
- test counts and failures
- knowledge validation result
- golden fixture result
- red-team fixture result
- build result
- remaining known limitations
- unresolved traditional variants
- screenshots for implemented UI

No unexecuted command may be described as passing.
