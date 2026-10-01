# CV Adapter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node ^20.19 or >=22.12](https://img.shields.io/badge/node-%5E20.19%20%7C%7C%20%3E%3D22.12-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-10.26.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

TypeScript CLI that generates CVs tailored to job openings using AI. Direct PDF output in Harvard format, without browser dependencies.

## Features

- **Multi-provider AI**: Groq, Gemini, OpenAI, Anthropic, Ollama
- **Categorized skills** (Languages, Frameworks, Tools, etc.) generated automatically by AI
- **Direct PDF generation with pdfmake** — no Chromium or external dependencies required
- **Bilingual**: Spanish / English
- **Reusable profile** stored in `~/.cv-adapter/profile.json`
- **Harvard format**: clean, ATS-friendly, optimized for one page

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env` and add your API key:

```bash
cp .env.example .env
```

Get your API key from:
- **Groq** (recommended, free): https://console.groq.com
- **Gemini**: https://aistudio.google.com
- **OpenAI**: https://platform.openai.com
- **Anthropic**: https://console.anthropic.com
- **Ollama** (local): https://ollama.ai

Edit `.env`:

```bash
ACTIVE_PROVIDER=groq
AI_API_KEY=your_key_here
```

> **Optional variables per provider** (defaults in `src/infrastructure/ai/`):
> `GROQ_MODEL`, `GEMINI_MODEL`, `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `OLLAMA_MODEL`.

## Usage

> ⚠️ **Important**: local production-mode use and `pnpm link --global` require running `pnpm build` first. The `.tgz` files attached to releases already include the compiled version.

### Development mode (without building, recommended for iteration)

```bash
pnpm dev -- init --pdf ~/cv/CV.pdf --lang es
pnpm dev -- generate "Senior Python Developer at Mercado Libre - Requirements: Python, Django, PostgreSQL"
pnpm dev -- profile --show
```

### Production mode (after building)

```bash
pnpm build
node dist/main.js init --pdf ~/cv/CV.pdf --lang es
node dist/main.js generate "Senior Python Developer at Mercado Libre"

# Short equivalent
pnpm start -- init --pdf ~/cv/CV.pdf --lang es
```

### As a global CLI

From a local checkout:

```bash
pnpm build
pnpm link --global
cv init --pdf ~/cv/CV.pdf --lang es
cv generate "Senior Python Developer at Mercado Libre"
```

From a `cv-adapter-*.tgz` file downloaded from a release:

```bash
pnpm add --global ./cv-adapter-1.0.0.tgz
cv --help
cv --version
```

> The project does not publish the package to npm. `npx cv ...` is not a supported installation method.

### Initialize a profile from your PDF CV

```bash
pnpm dev -- init --pdf ~/cv/CV_Lucas_Villanueva.pdf --lang es
```

### Generate a CV for a job opening

```bash
pnpm dev -- generate "Senior Python Developer at Mercado Libre - Requirements: Python, Django, PostgreSQL, 3+ years experience"
```

The command:
1. Loads your profile from `~/.cv-adapter/profile.json`
2. Prompts for the language (es/en) if `--lang` was not specified
3. Calls AI to generate a tailored CV with categorized skills
4. Prompts for the output file name
5. Generates the PDF directly and saves it in the current directory

Example output: `cv-senior-python.pdf` in your working directory.

### Other commands

```bash
# Update the profile with a new CV (initializes it if it does not exist)
pnpm dev -- update --pdf ~/cv/new_cv.pdf

# Show the current profile (without a flag, it also displays the profile)
pnpm dev -- profile
pnpm dev -- profile --show

# Edit the profile manually through a staged file (opens $EDITOR, default: nano)
pnpm dev -- profile --edit

# Interactive mode (menu) — alias: `i`
pnpm dev -- interactive
pnpm dev -- i
```

### Safe profile updates and manual edits

`update` and `profile --edit` never overwrite the live profile before validation and approval.
Manual editing writes a protected staged copy, runs `$EDITOR` directly with the staged path as its sole argument, waits for it to exit, validates the resulting JSON, displays the deterministic field diff, and then asks whether to replace the live profile. Only an accepted edit calls the same safe replacement path used by PDF updates.

Confirmation defaults to No. In a non-interactive session, replacement is refused unless `--yes` is passed:

```bash
pnpm dev -- update --pdf ~/cv/new_cv.pdf --yes
pnpm dev -- profile --edit --yes
```

Set `EDITOR` to an editor executable, for example `export EDITOR=vim`. Editor arguments are not parsed; use an executable that waits for its editing session to close.

## Quick reference

| Command | Description |
|---------|-------------|
| `pnpm dev -- init --pdf <path>` | Create a profile from a PDF |
| `pnpm dev -- init --pdf <path> --lang <es\|en>` | Create a profile in a specific language |
| `pnpm dev -- update --pdf <path>` | Update the profile from a new PDF |
| `pnpm dev -- generate "<vacancy>"` | Generate a CV tailored to a job opening |
| `pnpm dev -- generate "<vacancy>" --lang <es\|en>` | Generate a CV in a specific language |
| `pnpm dev -- profile` / `--show` | Show the current profile |
| `pnpm dev -- profile --edit` | Edit the staged profile in `$EDITOR` |
| `pnpm dev -- interactive` (alias `i`) | Interactive mode (menu) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start -- <args>` | Run the compiled version (`node dist/main.js`) |
| `pnpm test` | Run the test suite (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with a coverage report |
| `pnpm typecheck` | Check production and test types |

## Project structure

The project follows **hexagonal architecture** (domain / application / infrastructure / interfaces).

```
cv-adapter/
├── src/
│   ├── domain/                       # Core entities and errors
│   │   ├── entities/                 # Profile, CVData
│   │   ├── errors/                   # DomainError, etc.
│   │   └── index.ts                  # Barrel export
│   ├── application/                  # Use cases (orchestration)
│   │   ├── commands/                 # CLI commands
│   │   │   ├── InitCommand.ts        # init
│   │   │   ├── UpdateCommand.ts      # update
│   │   │   ├── GenerateCommand.ts    # generate
│   │   │   ├── ProfileCommand.ts     # profile (show / edit)
│   │   │   └── index.ts              # Barrel export
│   │   └── services/                 # Application services
│   │       ├── ParseProfile.ts       # PDF → Profile
│   │       ├── GenerateCV.ts         # Profile + vacancy → CVData
│   │       └── index.ts              # Barrel export
│   ├── interfaces/                   # Contracts (ports)
│   │   ├── IAIProvider.ts            # Provider contract
│   │   ├── IParser.ts                # Parser contract
│   │   ├── IPDFGenerator.ts          # PDF generator contract
│   │   ├── IProfileRepository.ts     # Persistence contract
│   │   └── Logger.ts                 # Logging interface
│   ├── infrastructure/               # Adapters
│   │   ├── ai/                       # Providers + base
│   │   │   ├── base.ts               # BaseAIProvider
│   │   │   ├── GroqAI.ts
│   │   │   ├── GeminiAI.ts
│   │   │   ├── OpenAI.ts
│   │   │   ├── AnthropicAI.ts
│   │   │   ├── OllamaAI.ts
│   │   │   ├── PromptBuilder.ts      # Prompt construction
│   │   │   └── schemas.ts            # Zod validation schemas
│   │   ├── parsers/                  # PDFParser
│   │   ├── pdf/                      # PDFGenerator, CVDataToPdfmakeConverter
│   │   └── repositories/             # JSONProfileRepository
│   ├── types/                        # TypeScript declarations (ambient)
│   └── main.ts                       # Entry point
├── test-data/                        # Mock data for tests
├── tests/                            # Tests (unit + integration)
│   ├── unit/
│   ├── integration/
│   └── helpers/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Tests + build in PRs
│       └── release.yml               # Publishes tgz files for v* tags
├── package.json
├── tsconfig.json
└── .env.example
```

## Development

### Tests

```bash
pnpm test              # Full suite (Vitest)
pnpm test:watch        # Watch mode
pnpm test:coverage     # With a coverage report
pnpm typecheck         # Production and test types
```

### Path aliases

`tsconfig.json` defines the following aliases (resolved by `tsx` in development and `tsc` in builds):

```ts
import { Profile } from '@domain/entities/Profile';
import { GenerateCV } from '@application/services/GenerateCV';
import type { IAIProvider } from '@interfaces/IAIProvider';
import { GroqAI } from '@infrastructure/ai/GroqAI';
```

Available aliases: `@domain/*`, `@application/*`, `@interfaces/*`, `@infrastructure/*`.

### Build

```bash
pnpm build             # tsc → dist/
```

Output: `dist/main.js` (executable with `node`, `pnpm start`, or the `cv` command after installing or linking the package).

`pnpm build` first removes any existing `dist/`. The release package includes only compiled JavaScript, metadata, the README, and the license; it does not include source files, tests, environment files, or local data.

## Requirements

- **Node.js ^20.19 or >=22.12** (required by the current toolchain; ES2022 target)
- **pnpm 10.26.0** (https://pnpm.io)
- API key for one of the supported providers

## Troubleshooting

**"No profile found" error**

Run this first: `pnpm dev -- init --pdf ~/path/to/your/cv.pdf`

**`cv` linked from a local checkout fails with "dist/main.js not found"**

Run `pnpm build` before `pnpm link --global`. Release `.tgz` files already contain `dist/`.

**AI errors**

- Verify that `AI_API_KEY` is correctly configured in `.env`
- Confirm that `ACTIVE_PROVIDER` is one of: `groq`, `gemini`, `openai`, `anthropic`, `ollama`
- For Ollama, make sure `ollama serve` is running on the default port
- If the provider returns 429/500 errors, try `groq` (free and fast) or adjust the model through `*_MODEL`

**PDF parsing fails**

Make sure the PDF has selectable text (not a scanned image). `pdf-parse` does not perform OCR.

**Skills are not categorized**

AI may not categorize them on the first iteration. Regenerate the CV or adjust the prompt in `src/infrastructure/ai/PromptBuilder.ts`.

**`cv profile --edit` opens nano and I do not like it**

Set the `EDITOR` environment variable to your preferred editor: `export EDITOR=vim`.

## Contributing

PRs are welcome. For large changes:

1. Open an issue first describing the change
2. Fork + branch (`feature/...` or `fix/...`)
3. Make sure `pnpm typecheck`, `pnpm test`, and `pnpm build` pass
4. Maintain the hexagonal architecture — new sources/sinks belong in `infrastructure/`, and new use cases belong in `application/`

## License

[MIT](LICENSE)
