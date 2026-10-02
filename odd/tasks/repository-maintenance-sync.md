# Repository Maintenance Sync

## Objective

Synchronize the local default branch with the authorized remote, remove only verified merged local branches, and correct stale historical ODD delivery records.

## Authorized Scope

- Fetch refs only from `github.com/KenaiiDev/cv-adapter` through `origin`.
- Fast-forward local `master` to verified `origin/master`.
- Create `chore/repository-maintenance-sync` from updated `master` before documentation edits.
- Delete only local branches verified as merged into `master`.
- Update `odd/tasks/repository-issue-intake.md` and `odd/tasks/p0-parser-experience-layout.md` with historical delivery evidence.
- Commit only this maintenance documentation in one Conventional Commit.

## Constraints

- Do not push, create or modify GitHub resources, delete remote branches, or use a remote other than the authorized fetch.
- Stop without mutation if unrelated uncommitted changes are present.
- Do not delete `master` or the current maintenance branch.
- Preserve historical tracker content and do not alter functional product scope.
- Keep the maintenance change under the advisory 400-line review budget.

## Route

- Chosen route: delegated, because the work spans two or more non-trivial documentation files and requires preparation reading.

## Stable Tasks

1. **RMS-1: Verify starting state and create tracker mirror**
   - Acceptance criteria: worktree is clean; this tracker is mirrored to Engram and both copies are read back before any existing repository file is edited.
2. **RMS-2: Synchronize branch references safely**
   - Acceptance criteria: `origin` is fetched, local `master` fast-forwards to verified `origin/master`, and the maintenance branch starts from that updated commit.
3. **RMS-3: Prune merged local branches only**
   - Acceptance criteria: every deleted local branch is verified merged into `master`; neither `master` nor the current branch is deleted.
4. **RMS-4: Correct stale historical delivery trackers**
   - Acceptance criteria: the issue-intake and parser-layout trackers record their completed, merged delivery evidence without changing product scope.
5. **RMS-5: Verify and commit maintenance documentation**
   - Acceptance criteria: document readback and `git diff --check` pass; this tracker and its Engram mirror record outcomes, checks, deleted branches, and commit identity; one Conventional Commit contains all changed maintenance documentation.

## Checks

- `git status --short --branch`
- `git diff --check`
- Final tracker readback
- Application test suite: N/A, because this maintenance changes documentation only and leaves application source unchanged.

## Progress

- RMS-1: complete. Starting worktree was clean on `feat/ai-cv-preview-approval` at `1e1eb1e846a733261343f34841864a4dff134417`; this tracker and its initial Engram mirror were read back before historical tracker edits.
- RMS-2: complete. `git fetch origin` advanced `origin/master` from `9bb798718bedd069877fc44a7a6ed3519d914d89` to `267763d9e49d3ae840570fccb914b6f389c17bbb`; local `master` fast-forwarded to that commit, and this branch was created from it.
- RMS-3: complete. No local branch qualified for deletion: `git branch --merged master` listed only `master` and the current maintenance branch. `feat/ai-cv-preview-approval` and `feat/ai-text-content-validation` were retained because neither is an ancestor of `master`.
- RMS-4: complete. The issue-intake tracker now records its delivered form workflow; the parser tracker now records merged PR #6 and feature-commit evidence.
- RMS-5: complete. `git diff --check` passed before staging and after the documentation commit; all three trackers were read back; the maintenance documentation commit was created with 71 additions and 8 deletions, within the advisory budget.

## Commit Evidence

- Commit: one Conventional Commit contains all three maintenance trackers. A tracked file cannot contain its own final Git object ID; the exact identity is recorded in the post-commit Engram outcome mirror and command report.
