# Batch 04 Acceptance Criteria

This file defines the implementation gate for the first local Web MVP. A controller may not claim the milestone is complete unless every mandatory item is either passed or explicitly marked blocked with evidence.

## 1. Repository and Tooling

- [ ] `npm install` completes without requiring private registries.
- [ ] `npm run build` completes successfully.
- [ ] TypeScript strict mode is enabled.
- [ ] No production dependency provides remote generative AI or remote divination.
- [ ] No API key is required for core operation.
- [ ] Core tests run in Node without browser DOM.
- [ ] GitHub Actions or equivalent CI runs validation, tests and build.

## 2. Request Contract

- [ ] `knowledge/divination-request.schema.json` compiles under JSON Schema Draft 2020-12.
- [ ] `knowledge/question-context.schema.json` compiles.
- [ ] Manual lunar requests validate.
- [ ] Civil datetime requests validate.
- [ ] Mismatched `inputMode` and `timeInput.kind` fail.
- [ ] Invalid lunar month, day and earthly branch fail.
- [ ] Unknown `calendarPolicyId` fails reference validation.
- [ ] Unknown `domainId` fails reference validation.
- [ ] Invalid `stageId` for a domain fails.
- [ ] Identity display fields are absent from the normalized core input.

## 3. Knowledge Integrity

- [ ] Every knowledge JSON file passes its Schema.
- [ ] Every ID is unique within its namespace.
- [ ] Every referenced palace ID exists.
- [ ] Every referenced domain ID exists.
- [ ] Every referenced stage ID exists in the correct domain.
- [ ] Every ethics rule reference exists.
- [ ] Every source ID exists.
- [ ] Every calendar policy reference exists.
- [ ] Palace order matches the frozen contract.
- [ ] Exactly one default calendar policy exists.
- [ ] Fixture files pass `fixtures/case.schema.json`.
- [ ] Modern text audit reports no prohibited certainty phrasing outside approved contexts.

## 4. Traditional Core Algorithm

- [ ] Palace order is exactly `da_an`, `liu_lian`, `su_xi`, `chi_kou`, `xiao_ji`, `kong_wang`.
- [ ] The core accepts only normalized lunar month, lunar day and earthly branch index plus algorithm metadata.
- [ ] The core does not accept question text, domain, gender, sexuality or identity.
- [ ] The traditional example lunar month 3, day 5, Chen hour returns `xiao_ji`.
- [ ] Month palace, day palace and hour palace trace are returned.
- [ ] Stepwise calculation equals the compressed formula for all mathematical inputs in the agreed enumeration.
- [ ] Palace periodicity holds under increments of 6.
- [ ] Invalid input returns typed errors.
- [ ] No random number, system clock or network call appears in the core.

## 5. Calendar Adapter

- [ ] Manual lunar input works without the civil calendar library.
- [ ] Civil datetime conversion is driven by `calendarPolicyId`.
- [ ] IANA timezone is explicit.
- [ ] DST ambiguous local time is handled or rejected with a typed error.
- [ ] Leap month information is preserved.
- [ ] The selected midnight policy is returned in the result.
- [ ] Unsupported calendar dates return a typed range error.
- [ ] Switching a disputed calendar policy is visible to the user.

## 6. Interpretation Engine

- [ ] The engine follows `algorithm/interpretation-engine-contract.md`.
- [ ] Exactly one neutral palace fragment is selected.
- [ ] Domain interpretation matches the final palace.
- [ ] Stage modifiers are selected only for valid domain-stage combinations.
- [ ] Fragment ordering is deterministic.
- [ ] Duplicate fragment IDs are removed.
- [ ] Candidate claims are structured before ethics evaluation.
- [ ] Missing references fail closed.
- [ ] No freeform generated prediction is introduced.
- [ ] The final result preserves fragment IDs and source trace.

## 7. Ethics Engine

- [ ] The engine follows `algorithm/ethics-engine-contract.md`.
- [ ] Rules sort by priority descending and ID ascending.
- [ ] Unknown conditions and effects fail closed.
- [ ] Severity merge is monotonic and cannot be downgraded.
- [ ] Suppressed claims never appear in user-visible output.
- [ ] Blocked fragments remain visible only in internal trace.
- [ ] `hard_stop` makes reality action the first UI section.
- [ ] The palace before and after ethics evaluation is identical.
- [ ] Explicit refusal cannot be overridden by any palace.
- [ ] Third-party sexual orientation or gender identity is never inferred.
- [ ] Same-sex relationships are not forced into husband-wife roles.
- [ ] Health output cannot diagnose or exclude risk.
- [ ] Finance output cannot issue buy, sell, transfer or return guarantees.
- [ ] Legal output cannot guarantee judgments or penalties.
- [ ] Missing-person danger triggers reality escalation.
- [ ] Crime cannot be attributed without evidence.
- [ ] Death and lifespan dates are blocked.
- [ ] Supernatural historical terms do not become causal claims.
- [ ] Minor safeguarding rules are enforced.

## 8. Golden and Red-Team Fixtures

- [ ] All cases in `fixtures/interpretation-golden-cases.v1.json` pass.
- [ ] All cases in `fixtures/ethics-red-team-cases.v1.json` pass.
- [ ] All cases in `algorithm/rule-conflict-examples.v1.json` pass.
- [ ] Tests verify required IDs, suppressed claim types and forbidden ideas.
- [ ] Tests do not rely only on broad snapshots.
- [ ] Fixture failures cannot be fixed by silently changing expected files without review.

## 9. Application Service

- [ ] One documented high-level service accepts a validated request.
- [ ] It returns a result conforming to `divination-result.schema.json`.
- [ ] It returns typed errors for request, calendar, knowledge and rule failures.
- [ ] It records algorithm, calendar policy, knowledge and rule versions.
- [ ] It does not persist question text unless the request explicitly allows it.
- [ ] It is deterministic for identical input and versions.

## 10. User Interface

- [ ] Manual lunar flow is complete.
- [ ] Domain selection is complete.
- [ ] Relevant stage selection is complete.
- [ ] Reality fact confirmation is available.
- [ ] Privacy defaults are visible.
- [ ] Request review appears before calculation.
- [ ] Result header shows palace, domain, algorithm and calendar policy.
- [ ] Calculation trace is visible and understandable.
- [ ] Modern interpretation and traditional text are separated.
- [ ] Source and variant status are visible.
- [ ] Ethics notices are placed near affected content.
- [ ] Hard-stop scenarios prioritize reality action.
- [ ] Provenance can be inspected.
- [ ] Palace library basic view exists.
- [ ] Mobile layout works at 360px width.
- [ ] Keyboard and screen-reader basics are implemented.
- [ ] Reduced motion is respected.
- [ ] No “calculate again until favorable” interaction exists.

## 11. Privacy and Network Audit

- [ ] Core use works offline after assets are installed.
- [ ] Question text is not sent over the network.
- [ ] There is no analytics or tracking by default.
- [ ] There are no hidden remote fonts required for core rendering, or a documented local fallback exists.
- [ ] Production logs do not include full question text or sensitive identity by default.
- [ ] Export defaults exclude full question text and exact time.
- [ ] `npm run audit:network` or equivalent reports all network-capable dependencies and endpoints.

## 12. Documentation and Reporting

- [ ] README reflects actual implementation status.
- [ ] Commands in README exist and were tested.
- [ ] Each subagent submits the required report.
- [ ] The controller lists actual commands run and results.
- [ ] Known limitations are explicit.
- [ ] Traditional variants remain marked provisional or disputed where unresolved.
- [ ] UI changes include screenshots.
- [ ] The implementation PR states whether the frozen algorithm changed.

## 13. Release Decision

The R1 MVP may be marked complete only if:

1. all core algorithm items pass
2. all knowledge validation items pass
3. all ethics hard-block and hard-stop tests pass
4. all golden and red-team fixtures pass
5. build succeeds
6. no remote AI dependency exists
7. an independent `test-audit-agent` has reviewed the integrated branch

Non-critical visual polish may remain open. Any failure in algorithm, ethics, knowledge integrity or privacy blocks release.
