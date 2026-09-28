# P0 Quality Baseline

## Objective

Make CI, Vitest, TypeScript checks, and declared Node/pnpm requirements describe and verify the same supported development workflow.

## Problem and Why

Production typechecking currently excludes tests, the default Vitest command does not discover the nested configuration, CI targets `main` while the repository uses `master`, and the documented/runtime toolchain requirements conflict. This weakens every later remediation because passing checks do not represent the full repository.

## Scope

- Align production and test typechecking without changing production emission.
- Make every Vitest invocation load the canonical setup.
- Repair existing test-only type drift exposed by the new check.
- Align CI and release workflows with the repository branch and declared toolchain.
- Document the supported Node and pnpm versions.

## Constraints

- Do not modify or stage generated local `.atl/` content.
- Do not change release semantics or publish packages in this work unit.
- Keep production behavior unchanged.
- Keep tests and documentation in the same work-unit commit.
- Prefer a cohesive implementation; the initial 80–130 line estimate was revised to approximately 269 lines after accounting for configuration movement and task evidence.

## Authorized Scope

The user authorized implementation of P0-01: CI, Vitest, production/test typechecking, and toolchain alignment.

## Delivery

- Strategy: `ask-on-risk`
- Forecast: initially 80–130 lines; observed candidate churn is approximately 269 lines including moved/new configuration and this tracker. One PR slice remains appropriate.
- Branch: `fix/p0-quality-baseline`
- Review boundary: branch point at `62367d7`.

## TDD and Checks

- Mode: enabled for this remediation work from the accepted RED/GREEN/REFACTOR plan.
- RED: capture the failing test typecheck and missing default Vitest setup/config behavior.
- GREEN: make production typecheck, test typecheck, default Vitest, explicit Vitest, and build pass.
- REFACTOR: remove duplicate configuration and keep scripts intention-revealing.
- Runner/checks: `pnpm typecheck:prod`, `pnpm typecheck:test`, `pnpm typecheck`, `pnpm test`, `pnpm exec vitest run`, `pnpm build`, `git diff --check`.

## Tasks

- [x] **P0-01-A — Establish canonical quality configuration**
  - Route: delegated writer.
  - Trigger: implementation spans multiple non-trivial configuration, workflow, test, and documentation files.
  - Acceptance: production and tests have explicit typechecks; root Vitest config is discovered by both test commands; toolchain and branch declarations agree.
  - Evidence: root `vitest.config.ts`, explicit production/test typecheck scripts, `tsconfig.test.json`, aligned `master` CI triggers, Node/pnpm declarations, and README requirements. Both Vitest routes resolve `tests/setup.ts` and the same 14 test files.
- [x] **P0-01-B — Repair test type drift**
  - Route: delegated writer in the same cohesive work unit.
  - Trigger: fixes span seven test files and depend on the canonical test typecheck.
  - Acceptance: test fixtures use domain types and mocks retain their mock-aware types without weakening production contracts.
  - Evidence: seven test files now use `SkillCategory` fixtures and preserve `MockProxy<T>` types; `pnpm typecheck:test` passes without weakening production interfaces.
- [ ] **P0-01-C — Verify and commit the baseline**
  - Route: delegated verification as required by risk assessment, plus parent spot check.
  - Acceptance: all applicable checks pass; unrelated `.atl/` files remain untouched; one Conventional Commit records the work unit.
  - Evidence: writer and independent verifier observed `pnpm typecheck`, `pnpm test` (14 files, 171 tests), `pnpm build`, and `git diff --check` passing. `pnpm install --frozen-lockfile`, both explicit typechecks, and explicit/default Vitest runs also passed in writer verification. GitHub-hosted workflow execution remains unavailable locally. Commit pending.

## Progress

- Configuration, workflows, tests, and README are aligned.
- Production source and `pnpm-lock.yaml` are unchanged.
- Independent verification found no implementation defect; only GitHub-hosted workflow execution remains an external residual risk.

## Next Step

Create the work-unit commit, assess the committed candidate, and record its identity.
