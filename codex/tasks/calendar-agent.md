# Task: calendar-agent

## Mission

实现独立、可测试、由 `calendarPolicyId` 驱动的历法适配层。你的输出是规范化农历输入，不负责六宫解释。

## Required Reading

- `AGENTS.md`
- `docs/03-calendar-policy.md`
- `algorithm/contract.md`
- `knowledge/calendar-policies.schema.json`
- `knowledge/calendar-policies.v1.json`
- `knowledge/divination-request.schema.json`
- `codex/batch-04-implementation-plan.md`
- `codex/batch-04-acceptance-criteria.md`

## Allowed Areas

- `src/calendar/**`
- `tests/calendar/**`
- calendar-specific dependencies and documentation

Shared type changes require architecture-agent and controller approval.

## Forbidden Areas

- Do not calculate palace indices beyond returning normalized input.
- Do not interpret question text.
- Do not read gender, sexuality or identity.
- Do not silently select a midnight or leap-month policy.
- Do not call remote calendar APIs.
- Do not modify traditional or ethics knowledge.

## Deliverables

1. Manual lunar adapter.
2. Civil datetime adapter.
3. IANA timezone parser.
4. Earthly branch index mapping.
5. Policy registry keyed by `calendarPolicyId`.
6. Leap-month preservation.
7. DST ambiguous and nonexistent time handling.
8. Typed calendar error union.
9. Calendar trace describing conversion and policy decisions.
10. Regression tests for all registered policies.

## Core Interface

Recommended shape:

```ts
normalizeTimeInput(
  timeInput: DivinationRequest['timeInput'],
  calendarPolicyId: string
): Result<NormalizedLunarInput, CalendarError>
```

`NormalizedLunarInput` must contain only the fields needed by the core plus trace metadata:

- lunarMonth
- lunarDay
- earthlyBranchIndex
- isLeapMonth
- calendarPolicyId
- conversion trace

The core-facing projection must remove all irrelevant metadata.

## Manual Lunar Priority

Implement manual lunar mode first. It must work even if civil conversion is unavailable or the chosen library does not support the date range.

## Policy Rules

- Policy IDs come from local data.
- Default policy is not hardcoded separately from the registry.
- 23:00 and civil-midnight strategies are distinct.
- Leap month treatment is explicit.
- Result records selected policy.
- Switching policy can legitimately change normalized date and must be testable.

## Tests to Run

- manual month 1–12, day 1–30, branch 1–12
- invalid month, day and branch
- leap month flag preservation
- civil datetime conversion examples
- DST fold and nonexistent time
- timezone changes near day boundary
- 22:59, 23:00, 23:59, 00:00 and 00:59
- unsupported library range
- policy ID not found

## Completion Report

Include:

- chosen calendar library and why
- supported date range
- policy mapping
- typed errors
- commands actually run
- test results
- known conversion limitations
- confirmation that no palace or interpretation logic was added
