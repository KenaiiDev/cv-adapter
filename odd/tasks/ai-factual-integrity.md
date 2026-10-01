# AI Factual Integrity

## Objective

Ensure generated CVs preserve factual profile data while allowing AI to tailor approved narrative content to a vacancy.

## Problem and Why

The AI boundary currently validates the response JSON structure but accepts model-provided identity, contact, experience, education, dates, and skills. A syntactically valid response can therefore alter or invent user facts.

## Scope

- Define a constrained AI response contract for editable CV content.
- Reconstruct factual fields from the canonical `Profile` in application code.
- Validate references to profile experience and skills before producing `CVData`.
- Add regression tests for rejected or ignored factual alterations.

## Constraints

- Identity, contact, companies, job titles, dates, and education are immutable profile facts.
- The AI may tailor only the summary and experience descriptions, without adding verifiable facts.
- Skill selection may only use skills present in the profile.
- Keep the output language and existing provider retry behavior intact.
- Do not add dependencies or change packaging metadata.

## Authorized Scope

The user explicitly authorized implementation after confirming the factual-integrity contract: immutable identity, contact, companies, job titles, dates, and education; AI-tailored summaries and descriptions may not add facts.

## Delivery

- Strategy: `ask-on-risk`.
- Forecast: 220–360 authored changed lines across two work units.
- Intended slice: one feature branch with two independently reviewable work-unit commits.

## TDD and Checks

- Mode: strict TDD, explicitly selected by the user.
- Runner: `pnpm test`; focused tests use `pnpm exec vitest run <paths>`.
- Core checks: focused Vitest suites, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check`.

## Tasks

- [x] **P1-01-A — Constrain and assemble AI CV content**
  - Route: delegated writer.
  - Trigger: implementation spans AI boundary contracts, provider assembly, prompts, and tests.
  - Acceptance: model output cannot override canonical identity, contact, experience facts, or education; output is assembled from `Profile` plus only approved AI-tailored content.
  - Checks: focused provider/schema tests; typecheck; full tests; build; diff check.
  - Rollback: restore the previous provider response contract and assembly path.
- [ ] **P1-01-B — Validate profile references and factual regressions**
  - Route: delegated writer.
  - Trigger: validation behavior and adversarial regression tests span provider contracts and test fixtures.
  - Acceptance: unknown experience references and non-profile skills are rejected or ignored according to the explicit contract; regression tests cover attempted factual alteration and invention.
  - Checks: focused provider/schema tests; typecheck; full tests; build; diff check.
  - Rollback: remove the reference-validation boundary while retaining the prior provider validation.

## Progress

- Read-only investigation confirmed that `CVDataSchema` validates structure only and `BaseAIProvider` accepts AI-provided factual fields.
- Feature branch `feat/ai-factual-integrity` created from `master`.
- Strict TDD selected by the user: every implementation step requires observed RED → GREEN → REFACTOR evidence.
- P1-01-A completed: AI responses are constrained to `summary` and profile-indexed experience descriptions. `BaseAIProvider` reconstructs all identity, contact, experience facts, education, skills, and languages from `Profile`.
- RED: `pnpm exec vitest run tests/unit/infrastructure/ai/BaseAIProvider.test.ts` observed 1 failing test because the provider returned AI-provided `Invented Name` instead of the profile name.
- GREEN: `pnpm exec vitest run tests/unit/infrastructure/ai/BaseAIProvider.test.ts tests/unit/infrastructure/ai/schemas.test.ts tests/unit/infrastructure/ai/PromptBuilder.test.ts` observed 3 passing files and 32 passing tests.
- REFACTOR: reviewed the constrained boundary; retained a single profile-index-to-description map in `BaseAIProvider` and no additional abstraction was warranted.
- Checks: `pnpm typecheck` passed; `pnpm test` passed (16 files, 184 tests); `pnpm build` passed; `git diff --check` passed.
- P1-01-A task commit: `HEAD` — `feat(ai): preserve profile facts in CV generation`.

## Next Step

Implement P1-01-B only after separate authorization/work-unit handoff.
