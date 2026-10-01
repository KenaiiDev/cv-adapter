# P0 Parser Experience Layout

Repository-relative locator: `odd/tasks/p0-parser-experience-layout.md`

## Objective

Preserve company and title fields when an experience entry presents them on the two lines immediately before a standalone date range.

## Problem and Why

`PDFParser.parseExperienceSection` creates an experience when it finds a standalone date line, but discards the adjacent company and title lines that precede it. This loses material CV information for a supported visual layout.

## Authorized Scope

- `src/infrastructure/parsers/PDFParser.ts`
- `tests/unit/infrastructure/parsers/PDFParser.test.ts`
- This tracker: `odd/tasks/p0-parser-experience-layout.md`

## Constraints

- Consume only adjacent, non-bullet company/title candidates immediately before a standalone date.
- Preserve inline-date parsing, fallback behavior, and descriptions.
- Do not redesign the parser or change the domain model, entrypoints, README, package metadata, lockfile, dependencies, `.atl/`, remotes, or unrelated worktree changes.
- Use only the isolated worktree at `.worktrees/p0-parser-experience-layout`; do not perform remote operations.
- RDD is opt-in and disabled for this work; no review is requested.

## TDD and Delivery

- TDD mode: enabled, sourced from the accepted remediation plan.
- Test runner: `pnpm vitest run tests/unit/infrastructure/parsers/PDFParser.test.ts`.
- Required checks: `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check`.
- Delivery strategy: `ask-on-risk`.

## Tasks

1. **Repair standalone company-title-date layout via RED/GREEN/REFACTOR**
   - Route: authorized bounded implementation in the isolated feature worktree.
   - Trigger evidence: `EXPERIENCIA PROFESIONAL` followed by company, title, standalone date, and bullet description currently loses company/title text.
   - Acceptance criteria: a focused regression asserts title, company, start date, end date, and description; RED fails before the repair; GREEN passes with only adjacent non-bullet candidates consumed; REFACTOR preserves the focused suite and existing behavior.
2. **Verify, commit, and record evidence**
   - Route: local verification and one work-unit Conventional Commit.
   - Trigger evidence: the bounded behavior change must retain reproducible test, scope, commit, and delivery evidence.
   - Acceptance criteria: all required checks pass; diff scope is limited to the authorized files; tracker records actual results and commit ID; RDD remains disabled; final tracker is mirrored to Engram and read back.

## Progress

- Isolated worktree and feature branch are ready from current `master`.
- Task 1 is complete through RED/GREEN/REFACTOR.
- Task 2 is verified and pending its single work-unit commit.

## Evidence

- RED: `pnpm vitest run tests/unit/infrastructure/parsers/PDFParser.test.ts` failed as expected with 1 failing and 22 passing tests. The received entry had `company: 'Freelance'` and `title: ''` instead of `Acme Corp` and `Senior Backend Engineer`.
- GREEN: the same focused command passed 23/23 tests after the minimal repair.
- REFACTOR: moving the candidate predicate outside the parsing loop preserved the focused result at 23/23 tests.
- Full suite: `pnpm test` passed 172/172 tests across 14 files.
- Type check: `pnpm typecheck` could not run because this repository has no `typecheck` script or executable (`Command "typecheck" not found`); the equivalent available command `pnpm exec tsc --noEmit` passed.
- Build: `pnpm build` passed.
- Diff check: `git diff --check` passed.
- Scope result: committed files are limited to this tracker, `src/infrastructure/parsers/PDFParser.ts`, and `tests/unit/infrastructure/parsers/PDFParser.test.ts`; package metadata, lockfile, dependencies, `.atl/`, remotes, and parent-worktree files are unchanged.
- RDD state: disabled/unmanaged; no review was requested or started.
- Commit identity: recorded in the final delivery because a Git commit cannot embed its own final object ID in its tracked content.

## Next Step

Create the single Conventional Commit containing the repair, regression test, and tracker.
