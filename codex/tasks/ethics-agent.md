# Task: ethics-agent

## Mission

实现结构化伦理规则求值器，阻止不允许的结论并生成现实提示。伦理引擎不得改变传统落宫。

## Required Reading

- `AGENTS.md`
- `docs/06-modern-ethics.md`
- `algorithm/ethics-engine-contract.md`
- `algorithm/rule-conflict-examples.v1.json`
- `knowledge/ethics-rules.v1.json`
- `knowledge/ethics-rules.schema.json`
- `fixtures/ethics-red-team-cases.v1.json`
- `codex/batch-04-acceptance-criteria.md`

## Allowed Areas

- `src/ethics/**`
- `tests/ethics/**`
- local conclusion and reality-action registries

Knowledge rule changes require knowledge-agent and controller review.

## Forbidden Areas

- Do not modify palace ID, trace or calendar result.
- Do not infer sensitive facts from free text.
- Do not replace hard-block logic with keyword rewriting.
- Do not classify attack, disease, crime or sexuality as fact without explicit structured input.
- Do not force same-sex relationships into husband-wife or yin-yang sex roles.
- Do not hide traditional text. Restrict its use to historical sections when required.

## Deliverables

1. stable rule sorter
2. condition evaluator
3. effect executor
4. severity merger
5. claim suppression
6. fragment blocking
7. forced conclusion registry
8. reality action registry
9. required notice collection and deduplication
10. hard-stop handling
11. typed rule errors
12. ethics trace
13. red-team tests
14. palace invariance test

## Mandatory Condition Types

- always
- domainEquals
- factEquals
- questionHasAnyFlag
- outputContainsAnyTag

Unknown condition types must fail closed.

## Mandatory Effect Types

Implement all effects used by `knowledge/ethics-rules.v1.json`, including:

- suppress_claim_types
- force_conclusion
- block_fragments_with_tags
- allow_topics
- preferred_terms
- forbid_terms_as_inference
- require_reality_action
- stop_divination_as_primary_action
- forbid_action_types
- replace_certainty_terms
- assert_invariant
- assert_priority
- historical_text_only
- append_context
- require_evidence_language
- exclude_from_core_input

Unknown effects must fail closed.

## Required Test Areas

- explicit refusal
- third-party orientation
- same-sex relationship role neutrality
- health diagnosis and risk exclusion
- death and lifespan
- finance action and return guarantee
- legal result guarantee
- missing person hard stop
- criminal accusation
- supernatural causation
- minor safeguarding
- severity monotonicity
- stable ordering
- notice deduplication
- forbidden claim cannot reappear through synonyms
- final palace unchanged

## Completion Report

Include:

- rules implemented
- condition and effect coverage
- tests actually run
- red-team case results
- suppressed claim examples
- hard-stop behavior
- confirmation that no core result was modified
- unresolved rule semantics escalated to controller
