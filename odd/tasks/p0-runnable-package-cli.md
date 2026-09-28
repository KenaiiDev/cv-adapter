# P0 Runnable Package and CLI Boundary

## Objective

Produce a clean, portable package whose installed `cv` executable works, and verify the real CLI boundary through subprocess tests and release smoke checks.

## Problem and Why

The package currently publishes `bin/cv` but excludes the required `dist/main.js`, can include local `.atl/` files, relies on a non-portable Bash wrapper, and can package stale build output. Existing CLI integration tests pass without launching the executable, so releases can attach a broken tarball while CI remains green.

## Scope

- Make builds clean and reproducible without tracking generated `dist/` output.
- Publish only required runtime files and map `cv` directly to the compiled Node entry point.
- Replace the vacuous CLI test with subprocess coverage for help, version, unknown commands, and missing required options.
- Await Commander async actions at the process boundary.
- Inspect and smoke-test the tarball in the release workflow.
- Update README packaging and execution documentation.

## Constraints

- Do not modify or stage generated local `.atl/` content.
- Do not add npm publication, changelog automation, or a version bump.
- Do not change domain/application behavior or profile data.
- Keep generated `dist/` untracked and `pnpm-lock.yaml` unchanged.
- Keep tests and documentation with the behavior they verify.

## Authorized Scope

The user authorized the next remediation unit after P0-01: runnable packaging and real CLI boundary tests.

## Delivery

- Strategy: `ask-on-risk`.
- Chain strategy: `feature-branch-chain`, explicitly selected by the user.
- Current branch: `fix/p0-runnable-package-cli`.
- Parent branch/commit: `fix/p0-quality-baseline` at `a2c639b`.
- Current review boundary: `a2c639b`.
- Forecast: initially 190–260 authored changed lines; observed candidate churn is 273 lines. Cumulative churn from `62367d7` is approximately 493 lines and remains split into two sub-400-line slices.
- Intended PR relationship: the P0-01 slice precedes this slice; remote tracker/PR creation remains a separate user decision.

```text
tracker branch (not created remotely)
└── fix/p0-quality-baseline
    └── 📍 fix/p0-runnable-package-cli
```

## TDD and Checks

- Mode: enabled from the accepted RED/GREEN/REFACTOR remediation plan.
- RED: prove the current tarball omits `dist/main.js`, includes local `.atl/`, and cannot execute; prove the current CLI test passes without launching the CLI.
- GREEN: packaged CLI supports help/version and deterministic error exits; package contents exclude development/local files.
- REFACTOR: remove the shell wrapper and centralize clean/package scripts without speculative release features.
- Core checks: `pnpm typecheck`, `pnpm test`, `pnpm clean`, `pnpm build`, `git diff --check`, package-content inspection, and execution from an isolated packed artifact.

## Tasks

- [x] **P0-02-A — Make build and package output reproducible**
  - Route: delegated writer.
  - Trigger: implementation spans package metadata, executable mapping, build scripts, and ignored output.
  - Acceptance: a clean build produces the runtime entry point; packed contents include required runtime files and exclude `.atl`, source, tests, dependencies, and environment files.
  - Evidence: `pnpm clean` removed `dist/`; `pnpm build` recreated it from source; the external 1.0.0 tarball contained 38 allowlisted files with `dist/main.js`, package metadata, README, and license present and no forbidden paths.
- [x] **P0-02-B — Test the real CLI process boundary**
  - Route: same delegated writer in the cohesive slice.
  - Trigger: behavior crosses Commander routing, process exits, stdout/stderr, and compiled execution.
  - Acceptance: subprocess tests cover help, package version, unknown command, and missing `init --pdf`; async actions use the awaited parsing boundary.
  - Evidence: four subprocess tests execute `src/main.ts` through `tsx` and cover help, package version, unknown-command exit 1, and missing-`--pdf` exit 1; `main.ts` now awaits `parseAsync()`.
- [x] **P0-02-C — Harden release smoke checks and documentation**
  - Route: same delegated writer.
  - Trigger: release packaging and README must stay synchronized with executable behavior.
  - Acceptance: the release job inspects and executes the produced tarball before attachment; README claims match supported local and packaged workflows.
  - Evidence: the release job asserts tarball contents, links the extracted package into an isolated external consumer, and runs help/version through the generated `cv` shim; README installation, build, and package-content claims match the implementation.
- [ ] **P0-02-D — Verify and commit the slice**
  - Route: delegated verification according to native risk plus parent spot check.
  - Acceptance: local checks and isolated artifact execution pass; `.atl/`, `pnpm-lock.yaml`, and unrelated files remain untouched; Conventional Commit evidence is recorded.
  - Evidence: writer and independent verifier observed `pnpm typecheck`, 14 test files/167 tests, `pnpm clean`, `pnpm build`, `git diff --check`, dry-run packing, external archive assertions, and generated-`cv` shim smoke scenarios passing. The isolated extraction reused repository dependencies through a disclosed symlink without network access. A genuine offline install remained unavailable because the local cache lacked `dotenv`; link semantics and the generated executable shim passed. Commit identity remains for the parent to record.

## Progress

- P0-02 implementation and independent verification completed without a commit; parent commit recording remains pending.

## Next Step

Parent records the work-unit commit identity after review.
