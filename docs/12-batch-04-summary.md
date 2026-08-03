# Batch 04 Summary: Implementation Handoff

## Purpose

Batch 04 closes the last specification gaps before R1 engineering. Batch 02 established the traditional algorithm, basic knowledge and ethics. Batch 03 added Schemas, output contracts, validation planning and structured fragments. Batch 04 defines exactly what enters the system, how interpretation and ethics rules execute, what the product must show, how subagents divide work and how completion is judged.

After Batch 04, the project should stop adding planning documents and begin implementation.

## Added Contracts

### Request and Question Context

- `knowledge/divination-request.schema.json`
- `knowledge/question-context.schema.json`

These files separate:

- time input
- calendar policy
- question domain and stage
- verified reality facts
- high-risk flags
- display-only identity fields
- privacy preferences

Identity fields are explicitly excluded from the core algorithm.

### Interpretation and Ethics Engines

- `algorithm/interpretation-engine-contract.md`
- `algorithm/ethics-engine-contract.md`
- `algorithm/rule-conflict-examples.v1.json`

The interpretation engine must produce Candidate Claims before ethics evaluation. The ethics engine uses stable priority, structured conditions and controlled effects. Unknown semantics fail closed.

### Controlled Safety Messages

- `knowledge/safety-messages.schema.json`
- `knowledge/safety-messages.v1.json`

Forced conclusions, reality actions and historical context codes now map to approved local messages. Codex must not invent safety text during implementation.

## Added Test Fixtures

- `fixtures/case.schema.json`
- `fixtures/interpretation-golden-cases.v1.json`
- `fixtures/ethics-red-team-cases.v1.json`

Golden cases cover normal interpretation paths including a gay man asking about relationships. Red-team cases cover explicit refusal, third-party orientation, medical risk exclusion, investment guarantees, missing persons, theft accusations, supernatural causation and death prediction.

## Added Product Definition

- `docs/10-product-requirements.md`
- `docs/11-ui-information-architecture.md`

The R1 product is a mobile-first local Web application with:

- manual lunar and civil datetime input
- visible calendar policy
- domain and stage selection
- reality fact confirmation
- privacy defaults
- calculation trace
- modern and traditional sections
- source and variant status
- hard-stop safety presentation
- provenance inspection
- basic palace knowledge browser

## Added Codex Handoff

- `codex/batch-04-implementation-plan.md`
- `codex/batch-04-acceptance-criteria.md`
- seven files under `codex/tasks/`

The seven mandatory agents are:

- architecture-agent
- calendar-agent
- core-algorithm-agent
- knowledge-agent
- ethics-agent
- frontend-agent
- test-audit-agent

Each task file defines reading, ownership, forbidden areas, deliverables, tests and completion report.

## Added Architecture Decisions

The ADR directory records:

1. local-only architecture
2. traditional algorithm boundary
3. civil midnight default
4. leap month policy
5. identity-neutral relationship model
6. no generative interpretation

Future changes must amend or supersede these decisions instead of silently changing constants.

## Updated Files

- `README.md`
- `CODEX_MASTER_PROMPT.md`
- `codex/orchestration.md`
- `codex/batch-03-implementation-gate.md`
- `scripts/README.md`
- `scripts/validation-manifest.json`

Batch 03 gate is retained as history but explicitly superseded by Batch 04.

## Final Foundation State

The foundation now defines:

```text
request contract
→ calendar policy
→ frozen calculation
→ interpretation selection
→ candidate claims
→ ethics evaluation
→ controlled safety messages
→ structured result
→ UI hierarchy
→ fixtures and audit
```

## Remaining Work

All remaining major work is implementation:

- project scaffold
- validation scripts
- calendar adapter
- core algorithm code
- interpretation engine
- ethics engine
- application service
- frontend
- tests and CI
- audit and screenshots

## Release Gate

R1 is blocked by any failure in:

- core calculation
- knowledge integrity
- ethics hard-block or hard-stop
- identity neutrality
- privacy
- golden fixtures
- red-team fixtures
- result Schema
- build
- independent audit

## Next Action

Clone or update `main`, read `CODEX_MASTER_PROMPT.md`, create the mandatory subagents and execute `codex/batch-04-implementation-plan.md`. Do not create another planning batch before beginning code unless a genuine unresolved contract conflict is discovered.
