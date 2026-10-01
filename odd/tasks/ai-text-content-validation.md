# AI Text Content Validation

## Objective

Reject AI-generated CV responses when `summary` or an `experience[].description` contains an empty or whitespace-only string.

## Scope

- Add schema-level validation only.
- Cover empty and whitespace-only values for `summary` and experience descriptions.
- Do not add a human preview or alter unrelated AI-response behavior.

## Stable Checklist

- [x] Confirmed repository state and created `feat/ai-text-content-validation` from default branch `master`.
- [x] Selected the direct schema-validation path; no delegation is required.
- [x] Add a failing focused test for an empty summary.
- [x] Add a failing focused test for a whitespace-only summary.
- [x] Add a failing focused test for an empty experience description.
- [x] Add a failing focused test for a whitespace-only experience description.
- [x] Apply the minimal schema validation that makes the focused tests pass.
- [x] Run the focused schema test command.
- [x] Run repository-declared test, lint, and typecheck commands when applicable.
- [x] Record observed command results and commit this work unit.

## Acceptance Criteria

1. A response with `summary: ""` is rejected.
2. A response with a whitespace-only `summary` is rejected.
3. A response with an experience `description: ""` is rejected.
4. A response with a whitespace-only experience description is rejected.
5. Existing valid AI CV response schemas remain accepted.
6. No human preview behavior is introduced.

## Checks

- Focused unit tests for `tests/unit/infrastructure/ai/schemas.test.ts` using the runner declared by the repository.
- Repository-declared test command.
- Repository-declared lint command, if provided.
- Repository-declared typecheck command, if provided.

## Route Evidence

- **Chosen route:** direct local implementation in the AI response schema and its focused unit tests.
- **Delegation:** none.
- **Trigger evidence:** the authorized work unit explicitly identifies `src/infrastructure/ai/schemas.ts` and `tests/unit/infrastructure/ai/schemas.test.ts` as the expected bounded change surface and prohibits preview work. The change is a local schema invariant with no external dependency or remote operation.

## Verification Log

- **RED:** `pnpm exec vitest run tests/unit/infrastructure/ai/schemas.test.ts` failed as expected: 1 test file failed, 4 tests failed, and 5 tests passed. Each new assertion received `true` from `safeParse` where rejection (`false`) was expected.
- **GREEN:** Added one shared `NonBlankTextSchema` refinement requiring `value.trim().length > 0`, reused for `summary` and `experience[].description`. `pnpm exec vitest run tests/unit/infrastructure/ai/schemas.test.ts` passed: 1 file and 9 tests passed.
- **REFACTOR:** No further refactor was needed. The shared schema prevents duplicate validation logic without changing valid text values.
- `pnpm test` passed: 16 test files and 190 tests passed.
- `pnpm typecheck` passed: production and test TypeScript projects completed successfully.
- Lint: N/A; `package.json` declares no lint script.
- `git diff --check` passed with no output.
- Runtime harness: N/A; this work unit is a schema invariant exercised through the public `CVDataSchema.safeParse` unit boundary.
- **Rollback boundary:** remove `NonBlankTextSchema` and the four blank-content cases from `src/infrastructure/ai/schemas.ts` and `tests/unit/infrastructure/ai/schemas.test.ts`; no unrelated behavior is affected.
- Work-unit commit: `feat(ai): reject blank generated CV text`.
