# Task: frontend-agent

## Mission

构建移动端优先、无障碍、透明可追踪的本地 Web 界面。UI 只消费应用服务结果，不重写算法、知识或伦理逻辑。

## Required Reading

- `AGENTS.md`
- `docs/10-product-requirements.md`
- `docs/11-ui-information-architecture.md`
- `docs/09-output-contract.md`
- `knowledge/divination-request.schema.json`
- `knowledge/divination-result.schema.json`
- `codex/batch-04-acceptance-criteria.md`

## Allowed Areas

- `src/components/**`
- `src/pages/**`
- `src/styles/**`
- frontend state and form adapters
- `tests/ui/**`

## Forbidden Areas

- Do not calculate palaces in components.
- Do not import raw palace-order constants for independent calculation.
- Do not freeform rewrite interpretation text.
- Do not hide calendar policy, source status, disputed fields or ethics notices.
- Do not send question text to remote services.
- Do not add “try again for a better result” interactions.
- Do not assume heterosexual marriage or request attack/receiver roles.

## Deliverables

1. app shell and navigation
2. manual lunar input flow
3. civil datetime flow when adapter is ready
4. calendar policy picker
5. domain and stage picker
6. reality fact confirmation
7. privacy options
8. request review step
9. hard-stop banner
10. result header
11. calculation trace
12. modern interpretation sections
13. traditional text and variants
14. source list
15. provenance drawer
16. palace library basic view
17. settings for appearance, language and privacy
18. accessible error states

## Data Flow

```text
form state
→ validated DivinationRequest
→ application service
→ DivinationResult or typed error
→ render only
```

The UI may format dates and labels, but may not alter result semantics.

## Safety Presentation

- `hard_stop`: reality action appears before palace result and receives primary visual emphasis.
- `hard_block`: relevant boundary appears beside the affected interpretation.
- explicit refusal: show respect-refusal conclusion before relationship tendency.
- health: show non-diagnosis notice before health interpretation.
- source dispute: show visible provisional or disputed badge.

## Accessibility Requirements

- semantic headings
- form labels and described errors
- keyboard-operable controls
- screen-reader-friendly trace order
- no color-only palace meaning
- reduced motion
- mobile width 360px support
- focus management after submission and errors

## Visual Direction

Use an archive and calendar-tool aesthetic. Avoid gambling, horror, occult alarm or fake scientific certainty.

## Tests to Run

- form validation
- manual lunar submission
- domain-stage dependency
- privacy defaults
- hard-stop ordering
- explicit refusal notice
- third-party identity boundary
- health notice
- source and provenance visibility
- keyboard navigation
- 360px responsive smoke test
- no duplicate algorithm code scan

## Completion Report

Include:

- pages and components
- screenshots at mobile and desktop widths
- accessibility checks
- tests actually run
- known UI limitations
- confirmation that components do not calculate palaces or generate interpretation text
