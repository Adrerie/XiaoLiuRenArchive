# Task: core-algorithm-agent

## Mission

实现冻结的小六壬月、日、时起课纯函数和完整 trace。你只负责确定性数学核心。

## Required Reading

- `AGENTS.md`
- `docs/02-algorithm-spec.md`
- `algorithm/contract.md`
- `algorithm/test-vectors.v1.json`
- `knowledge/palaces.v1.json` 中的固定 palace ID 与 order
- `codex/batch-04-acceptance-criteria.md`

## Allowed Areas

- `src/core/**`
- `tests/core/**`
- core-specific type guards and test helpers

## Forbidden Inputs

The public core function must not accept:

- `Date`
- timezone
- question text
- domain or stage
- name
- gender
- sexual orientation
- gender identity
- relationship role
- random seed
- current system time

## Frozen Algorithm

```text
monthIndex = (lunarMonth - 1) mod 6
dayIndex = (monthIndex + lunarDay - 1) mod 6
hourIndex = (dayIndex + earthlyBranchIndex - 1) mod 6
```

Palace order:

```text
da_an
liu_lian
su_xi
chi_kou
xiao_ji
kong_wang
```

Do not reinterpret or optimize away the trace.

## Deliverables

1. Immutable palace order constant.
2. `positiveMod` utility.
3. normalized input validator.
4. `calculateMonthPalace`.
5. `calculateDayPalace`.
6. `calculateHourPalace`.
7. `calculateDivinationCore` returning full trace.
8. typed core errors.
9. fixed vector tests.
10. exhaustive property tests.
11. identity-invariance boundary test proving unrelated fields never enter the API.

## Trace Requirements

Each step should include:

- input value
- start palace index
- count convention
- formula or count offset
- resulting index
- resulting palace ID

The trace must make “月上起日，日上起时” visible.

## Tests to Run

- traditional 3/5/Chen example returns `xiao_ji`
- all fixed vectors
- 12 × 30 × 12 mathematical enumeration
- stepwise equals compressed formula
- plus-6 periodicity for month, day and hour where mathematically applicable
- palace ID and index consistency
- invalid values
- no mutation
- repeatability across repeated calls

Do not use snapshots as the only algorithm assertion.

## Completion Report

Include:

- exact public API
- test commands and counts
- property test method
- files changed
- confirmation that frozen formula and palace order were unchanged
- any ambiguity escalated to controller rather than decided locally
