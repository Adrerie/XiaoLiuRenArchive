# ADR 0001: Local-Only Core Architecture

Status: Accepted

## Context

The project handles personal questions, relationship context and potentially sensitive health, legal or financial topics. The calculation and knowledge base are deterministic and do not require remote inference.

## Decision

Core calculation, calendar conversion, knowledge lookup, interpretation assembly and ethics evaluation run locally. The first release does not call generative AI, remote divination, cloud inference or user-profile services.

External links may be opened for source reading, but they are not required for calculation.

## Consequences

Positive:

- privacy by default
- offline operation
- deterministic output
- no API keys
- easier audit
- lower operational dependency

Negative:

- larger local knowledge bundle
- local calendar library maintenance
- no freeform conversational interpretation

## Constraints

- question text is not uploaded
- production logs omit sensitive text by default
- network-capable dependencies require audit
- remote fonts must have local fallback
- future cloud features require a new ADR and explicit opt-in
