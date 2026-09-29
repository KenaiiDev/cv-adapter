# P0 Safe Profile Updates

## Objective

Ensure that importing or manually editing a profile cannot destroy a previously valid profile.

## Problem and Why

Profile parsing currently persists immediately, stored JSON is trusted without runtime validation, updates overwrite the live file directly, and manual editing executes `$EDITOR` through a shell against the live profile. Invalid data, interrupted writes, or editor failures can therefore corrupt or replace the user's only valid profile.

## Scope

- Separate profile parsing from persistence.
- Validate profile structure at runtime when parsing, loading, and replacing profiles.
- Show deterministic changes and confirm before replacing an existing profile.
- Use a rolling backup and same-directory atomic replacement.
- Stage manual edits outside the live profile and launch the editor without a shell.
- Preserve initialization and update-without-profile behavior.
- Document the confirmation and editor contracts.

## Constraints

- Preserve version `1.0.0`, package metadata, packaging behavior, and `pnpm-lock.yaml`.
- Do not modify or stage `.atl/` or unrelated files.
- Validation is structural: existing empty strings and arrays remain valid.
- Interactive confirmation defaults to No; non-TTY updates refuse unless `--yes` is supplied.
- Use one rolling `profile.json.bak`; timestamped history is out of scope.
- Keep tests and documentation with the behavior they verify.

## Authorized Scope

The user explicitly authorized safe profile updates and selected the safe confirmation contract with an explicit `--yes` automation bypass.

## Delivery

- Strategy: `ask-on-risk`.
- Chain strategy: `feature-branch-chain`, previously selected by the user.
- Current branch: `fix/p0-safe-profile-updates`.
- Parent branch/commit: `fix/p0-runnable-package-cli` at `6e12eec`.
- Current review boundary: `6e12eec`.
- Forecast: 480–690 authored changed lines across two cohesive work units.
- Intended slices: safe PDF replacement first, safe staged editor second.
- Push and pull-request creation remain separate user decisions.

## TDD and Checks

- Mode: enabled by the accepted RED/GREEN/REFACTOR remediation plan.
- Runner: `pnpm exec vitest run` for focused tests; `pnpm test` for the full suite.
- Use vertical RED → GREEN cycles, one observable behavior at a time.
- Core checks: focused Vitest suites, `pnpm typecheck`, `pnpm test`, `pnpm build`, `git diff --check`, and CLI/runtime scenarios where applicable.

## Tasks

- [x] **P0-03-A — Make PDF profile replacement safe**
  - Route: delegated writer.
  - Trigger: implementation spans domain validation, application commands, repository persistence, CLI composition, and tests.
  - Acceptance: parsing has no persistence side effect; malformed profiles are rejected; declined and failed updates preserve the live profile; confirmed updates create an exact backup and atomically replace the profile; initialization behavior remains supported.
  - Checks: focused domain, parser, repository, init, and update tests; typecheck; full tests; build; diff check.
  - Rollback: restore the previous parse/save path and repository API without touching package or editor behavior.
- [ ] **P0-03-B — Stage manual edits and remove shell execution**
  - Route: delegated writer.
  - Trigger: behavior spans temporary files, process execution, validation, diff/confirmation, repository replacement, CLI composition, tests, and README.
  - Acceptance: the live profile is never edited directly; editor executable and file path bypass the shell; completion is awaited; invalid, failed, declined, or cancelled edits preserve the live profile; accepted edits use the safe replacement path.
  - Checks: focused profile-command and process-adapter tests; runtime editor harness; typecheck; full tests; build; diff check.
  - Rollback: remove staged editing while retaining safe PDF replacement.
- [ ] **P0-03-C — Verify and record delivery evidence**
  - Route: delegated verification according to native risk plus parent spot checks.
  - Acceptance: all applicable checks pass; `.atl/`, `pnpm-lock.yaml`, version, and unrelated behavior remain untouched; each completed work unit has a Conventional Commit identity and risk outcome.

## Progress

- Read-only mapping completed.
- Confirmation contract selected: interactive No by default; non-TTY requires `--yes`.
- P0-03-A implemented on `fix/p0-safe-profile-updates` as one cohesive safe-replacement work unit; P0-03-B has not started.
- Parsing now returns a validated candidate without persistence or direct output; initialization and update-without-profile persist explicitly.
- Existing and candidate profiles receive structural runtime validation while retaining empty strings and arrays.
- Existing-profile updates load current state, show deterministic leaf-path changes, default confirmation to No, refuse non-TTY replacement without `--yes`, and replace through exact rolling backup plus same-directory atomic rename.
- RED evidence: focused failures demonstrated the missing validator, parsing side effect, explicit init persistence, malformed-JSON boundary, replacement API, confirmation, complete array-entry paths, and CLI `--yes` option before each minimal implementation.
- GREEN evidence: focused domain/parser/repository suites pass 30 tests; focused init/update suites pass 19 tests; the full suite passes 183 tests.
- Verification: `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check` pass. Runtime harness `pnpm exec tsx src/main.ts update --help` exposes `--yes` without mutating profile state.
- Review budget: this work unit exceeds 400 authored changed lines because validation, command orchestration, transactional persistence, CLI wiring, behavior tests, and tracker evidence form one rollback-safe replacement contract; splitting them would leave an unsafe intermediate update path.
- Initial P0-03-A commit: `b014284c5d11d31949089b8a96a5a2a1fbad54ad` (`feat(profile): make PDF profile replacement safe`).
- Independent verification found three candidate-caused filesystem gaps: a pre-existing `0600` profile and its backup widened to `0644`, an existing backup symlink target was overwritten, and a failed live rename destroyed the prior rolling backup.
- Bounded correction RED evidence: the mode test observed `0644` instead of `0600`; the symlink test observed its protected target overwritten; the forced live-rename test observed prior backup bytes replaced by current live bytes.
- Bounded correction GREEN evidence: repository tests pass 8 tests; focused domain/parser/repository suites pass 34 tests; focused init/update/CLI suites pass 24 tests; the full suite passes 187 tests.
- The correction creates profile and transaction files with protected permissions, preserves or tightens an existing safe mode without widening it, publishes backups from protected regular temporary files by atomic rename, and restores the prior backup when live replacement fails.
- External temporary-directory harness evidence: `profileMode=600`, `backupMode=600`, backup symlink target untouched, published backup is regular, forced failure observed, live bytes preserved, prior backup bytes preserved, and no transaction files remained.
- Correction checks: `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check` pass.
- Correction work-unit commit: `5acba4fb196ae865088e9dd5f145d15c0374ef59` (`fix(profile): secure transactional profile replacement`).
- Residual follow-ups: durability `fsync` and concurrent-writer control remain explicitly outside this correction scope.

## Next Step

Implement P0-03-B as a separate work unit without weakening the safe replacement boundary completed in P0-03-A.
