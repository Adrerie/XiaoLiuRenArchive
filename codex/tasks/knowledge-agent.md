# Task: knowledge-agent

## Mission

实现本地知识包验证、加载、索引和解释片段选择。你负责知识工程，不负责改写传统规则或自由生成断语。

## Required Reading

- `AGENTS.md`
- `docs/04-knowledge-model.md`
- `docs/07-source-collation.md`
- `algorithm/interpretation-engine-contract.md`
- all `knowledge/*.schema.json`
- all versioned knowledge JSON files
- `fixtures/case.schema.json`
- `scripts/validation-manifest.json`

## Allowed Areas

- `src/knowledge/**`
- `scripts/**`
- `tests/knowledge/**`
- knowledge JSON only when fixing a verified schema or reference defect

Any traditional text or variant change requires controller review and source explanation.

## Forbidden Areas

- Do not upgrade a web transcription to canonical.
- Do not remove provisional or disputed status to make UI cleaner.
- Do not silently fill missing fields at load time.
- Do not write freeform predictions.
- Do not change the frozen calculation.
- Do not resolve a textual variant without human approval.

## Deliverables

1. Draft 2020-12 Schema validator.
2. dataset validation command.
3. cross-reference validation command.
4. unique ID checks.
5. immutable knowledge bundle loader.
6. indexes by palace, domain, stage, fragment, rule and source ID.
7. deterministic fragment selector.
8. domain and stage validation.
9. source trace resolver.
10. modern text audit for forbidden certainty and identity stereotypes.
11. fixture file validation.
12. knowledge validation report.

## Interpretation Responsibilities

Implement the pre-ethics stages defined in `algorithm/interpretation-engine-contract.md`:

- palace neutral layer
- domain layer
- stage modifiers
- action prompts
- historical context
- candidate claim extraction

The ethics-agent owns rule effects. Coordinate on the CandidateClaim interface.

## Fail-Closed Rules

Return typed errors when:

- required dataset is missing
- Schema fails
- a referenced ID is missing
- there are duplicate IDs
- there is not exactly one neutral fragment for a palace
- domain lacks a palace interpretation
- stage does not belong to domain
- source trace cannot be resolved

Do not continue with partial knowledge in production mode.

## Required Tests

- all datasets validate
- all fixture collections validate
- all reference checks in validation manifest pass
- all six palaces have one neutral fragment and one action fragment
- all domains cover all six palaces
- fragment ordering is stable
- deduplication by ID
- invalid stage fails
- missing ethics rule reference fails
- missing source reference fails
- modern text audit excludes historical text scopes
- knowledge bundle is immutable

## Completion Report

Include:

- validation commands
- files checked
- error counts
- indexes created
- interpretation stages implemented
- tests actually run and results
- unresolved textual variants
- confirmation that no traditional text was silently changed
