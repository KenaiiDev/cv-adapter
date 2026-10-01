# AI CV Preview Approval

## Objective

Require an explicit human approval of a readable, deterministic generated-CV preview before `cv generate` asks for a filename, creates a PDF buffer, or writes a PDF.

## Scope

- Add a dedicated generated-CV review and approval port and interactive adapter.
- Render a readable deterministic preview from every `CVData` field used by PDF generation.
- Inject PDF creation and file-writing seams into the generation use case for isolated tests.
- Cancel safely on rejection and in non-interactive sessions.
- Keep adapter composition in `src/main.ts`, outside the generation use case.

## Constraints

- Do not couple the application use case to Inquirer or `process.stdin`.
- Do not import or construct concrete adapters from `GenerateCommand`.
- Do not reuse `UpdateConfirmation`; generated-CV approval is a distinct domain boundary.
- The preview is readable text, not JSON.
- Approval defaults to false and is required only in TTY sessions.
- On rejection or non-interactivity, do not request a filename, generate a PDF buffer, or write a file.
- Do not add preview editing or regeneration.
- Code, tests, documentation, and CLI copy remain in English.

## Resolved TDD Mode

Classic red-green-refactor: add focused command tests that fail against the current behavior, then introduce the smallest port, adapters, and injected seams to make them pass.

## Delegation Route

Delegate only if implementation expands to two or more non-trivial source files beyond the command and its focused test. The delegated scope must preserve the port/adapter boundary and return independently verified evidence.

## Delivery Strategy

Single cohesive work-unit commit with a size exception: 437 authored changed lines. The ports, adapters, command wiring, tests, and tracker are one inseparable approval boundary; splitting would leave incomplete behavior or separate its verification from the implementation.

## Tasks

- [x] `ACVPA-01` Add failing command tests for approved, rejected, and non-interactive generation paths, including no PDF creation or file writes after cancellation.
- [x] `ACVPA-02` Add the generated-CV review and approval port, readable deterministic preview renderer, and TTY Inquirer adapter.
- [x] `ACVPA-03` Wire review approval and injectable PDF/write seams into `GenerateCommand` and the CLI composition root.
- [x] `ACVPA-04` Run focused and repository checks, record observed results, and commit the complete work unit.
- [x] `ACVPA-05` Move generated-CV adapter composition to `src/main.ts` and test the concrete Inquirer adapter without terminal interaction.

## Acceptance

- Generated CV data is shown in readable deterministic text before filename prompting and PDF persistence.
- In a TTY, only explicit approval proceeds to filename request, PDF buffer generation, and file write.
- Rejection and non-interactivity print cancellation and skip filename, PDF buffer generation, and writes.
- The use case depends on a dedicated review/approval port rather than Inquirer, `process.stdin`, or `UpdateConfirmation`.
- Tests cover approval and rejection; non-TTY behavior is covered where exposed by the design.
- The concrete review adapter emits the preview, defaults to rejection, and rejects without prompting outside a TTY.

## Checks

- Focused tests: `pnpm exec vitest run tests/unit/infrastructure/confirmation/InquirerGeneratedCVReview.test.ts tests/integration/commands/GenerateCommand.test.ts tests/unit/application/services/FormatCVPreview.test.ts --no-file-parallelism`.
- Full suite: `pnpm test`.
- Typecheck: `pnpm typecheck`.
- Lint: no lint script is currently declared; record N/A after verification.
- Whitespace: `git diff --check`.

## Results

- `ACVPA-01`: Added three focused command tests. RED observed with all three timing out at the current direct filename prompt, proving the missing approval and injectable-side-effect boundaries.
- `ACVPA-02`: Added the dedicated `GeneratedCVReview` port, default-deny TTY Inquirer adapter, and formatter. The formatter test covers every field rendered by the PDF converter and passed.
- `ACVPA-03`: `GenerateCommand` now cancels before filename/PDF/write side effects on rejection and non-TTY sessions. The three command scenarios passed with the formatter test.
- `ACVPA-04`: GREEN focused tests: 2 files and 4 tests passed. Full suite: 18 files and 194 tests passed. `pnpm typecheck`, `pnpm build`, and `git diff --check` passed. `pnpm run lint` is N/A because `package.json` has no lint script. Runtime CLI harness is N/A because it requires a configured profile and external AI provider; isolated command tests cover the persistence boundary without either dependency.
- `ACVPA-05`: RED: the new non-TTY adapter test failed because `review()` emitted a preview and called Inquirer despite `process.stdin.isTTY` being false. GREEN: the adapter now returns `false` before preview or prompt outside a TTY; the focused suite passed 3 files and 7 tests. `GenerateCommand` no longer imports or constructs concrete adapters or providers; `src/main.ts` is the composition root. Full suite: 19 files and 197 tests passed. `pnpm typecheck`, `pnpm build`, and `git diff --check` passed. Lint remains N/A because `package.json` has no lint script. Runtime CLI harness remains N/A because it requires a configured profile and external AI provider; isolated command and adapter tests cover the persistence and interaction boundaries without either dependency.
- Commit: `fix(generate): compose preview adapters at root`.
