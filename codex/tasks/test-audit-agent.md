# Task: test-audit-agent

## Mission

对整合后的 R1 MVP 进行独立审计。你不得参与主要实现，也不得修改预期值来让现有代码通过。

## Required Reading

- `AGENTS.md`
- all algorithm contracts
- all test vectors and conflict examples
- all request and result schemas
- all fixtures
- `docs/08-testing-standard.md`
- `codex/batch-04-acceptance-criteria.md`

## Allowed Areas

- `tests/audit/**`
- audit scripts
- audit report files
- CI review comments

Bug fixes should be returned to the owning agent. Direct production-code fixes require controller approval and must remain separate from audit conclusions.

## Independence Rules

- Derive expected core results from the frozen contract.
- Do not trust implementation constants without comparison.
- Do not accept snapshots as sole proof.
- Do not mark unrun commands as passing.
- Do not rewrite fixtures without human review.
- Report false positives and false negatives separately.

## Audit Areas

### Algorithm

- palace order
- traditional example
- all vectors
- exhaustive 12 × 30 × 12 mathematical enumeration
- stepwise/compressed equivalence
- periodicity
- typed invalid input
- determinism

### Calendar

- registered policies
- midnight boundaries
- timezone conversion
- leap month
- DST ambiguity
- unsupported range

### Knowledge

- all Schemas compile
- all datasets validate
- all references exist
- all IDs unique
- source trace
- fixture validation
- modern text audit

### Interpretation

- one neutral fragment per palace
- domain coverage
- stage selection
- deterministic ordering
- deduplication
- candidate claim extraction
- fail-closed behavior

### Ethics

- all rule conflict examples
- all red-team cases
- explicit refusal
- third-party identity
- health
- finance
- law
- missing persons
- crime accusation
- death and lifespan
- supernatural causation
- minors
- palace invariance

### Architecture

- core import boundaries
- no algorithm in UI
- no remote AI
- no question upload
- no hidden API key
- offline operation
- production log privacy

### UI

- request flow
- trace visibility
- traditional/modern separation
- hard-stop ordering
- source and variant display
- accessibility basics
- mobile width

## Mandatory Commands

Run the project-defined equivalents of:

```bash
npm run typecheck
npm run validate:knowledge
npm run validate:references
npm run audit:text
npm run test:core
npm run test:ethics
npm run test:fixtures
npm test
npm run build
npm run audit:network
```

Record exact output summaries and exit codes.

## Blocking Findings

Any of the following blocks merge:

- incorrect palace result
- identity field affects palace
- missing or invalid knowledge reference
- explicit refusal overridden
- third-party identity inferred
- health diagnosis or risk exclusion
- investment or legal guarantee
- missing-person hard-stop failure
- death date output
- supernatural causal reinforcement
- suppressed claim visible
- remote question upload
- result violates output schema
- test command not actually run but claimed passed

## Deliverable

Create an audit report with:

- commit SHA audited
- environment
- commands and exit codes
- pass/fail table
- blocking findings
- non-blocking findings
- reproduction steps
- fixture results
- screenshots reviewed
- recommendation: approve, request changes or blocked

Do not approve your own implementation work.
