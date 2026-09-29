# Repository Issue Intake Bootstrap

## Objective

Add a minimal GitHub Issue Form that captures structured change and bug reports for the repository PR workflow.

## Problem

The default branch has no GitHub Issue Form, so contributors cannot submit the required change or bug context through a consistent, reviewable intake path.

## Scope

- Add one YAML Issue Form under `.github/ISSUE_TEMPLATE/`.
- Include required problem or desired-outcome, rationale or reproduction-and-impact, scope-and-acceptance-criteria, and acknowledgement inputs.
- Commit the form and this tracker together as one Conventional Commit.

## Constraints

- Use professional English UI copy and valid GitHub Issue Form schema.
- Do not create a pull request or change labels, including `status:approved`.
- Do not edit `.atl/`, package files, lockfiles, source files, or the completed profile branch.
- Do not force-push or retry a push blindly.

## Exact Authorized Direct-Master Scope

The user explicitly authorized one direct push of this bootstrap work unit to `github.com/KenaiiDev/cv-adapter` branch `master`, using the configured GitHub remote/session. The authorized commit may contain only this tracker and the minimal Issue Form.

## Checklist

- [x] Inspect `origin/master` from an isolated worktree.
- [x] Create this tracker before writing the Issue Form.
- [x] Mirror this tracker in Engram and read both copies back.
- [x] Add and locally validate the YAML Issue Form.
- [ ] Commit only the tracker and form with a Conventional Commit.
- [ ] Push the exact commit once to `origin master`.
- [ ] Verify the exact remote commit and form path through the GitHub API.
- [ ] Update this tracker and its Engram mirror with final evidence.

## Route and Trigger

GitHub repository issue creation routes contributors to the new Change or Bug Report Issue Form.

## Verification Evidence

- Baseline: `origin/master` resolved to `62367d7223b51320a5f8bd11655ba4d983007622` (`docs: expand README and align code with documented behavior`).
- Baseline: `origin/master` contains `.github/workflows/` but no `.github/ISSUE_TEMPLATE/` or tracked `odd/` paths.
- Isolation: detached worktree created at `.worktrees/issue-intake` from the baseline commit; the primary worktree remains on `fix/p0-safe-profile-updates` with its pre-existing untracked `.atl/` directory untouched.
- Local validation: `python3 -c '<Issue Form schema assertions>'` printed `YAML and required Issue Form controls: valid`; `git diff --check` passed.

## Rollback

Revert the single bootstrap commit on `master`; this removes only the Issue Form and this tracker without affecting application source, package metadata, labels, or the profile branch.

## Next Step

Commit the tracker and validated Issue Form, then push the resulting commit once to `origin master`.
