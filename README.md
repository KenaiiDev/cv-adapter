# CV Adapter

CLI tool to generate tailored CVs from job vacancies using AI.

## Setup

```bash
cd cv-adapter
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

## Usage

### Development mode (no build needed)

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
```

### As global CLI command (after linking)

```bash
npm link
cv init --pdf ~/cv/CV.pdf --lang es
cv generate "Senior Python Developer at Mercado Libre"
```

### Initialize profile from your CV PDF

```bash
pnpm dev -- init --pdf ~/cv/CV_Lucas_Villanueva.pdf --lang es
```

### Generate CV for a job vacancy

```bash
pnpm dev -- generate "Senior Python Developer at Mercado Libre - Requirements: Python, Django, PostgreSQL, 3+ years experience"
```

The command will:
1. Load your profile
2. Ask for language (es/en)
3. Call AI to generate tailored CV
4. Open preview in browser
5. Click "Descargar PDF" to save

### Other commands

```bash
# Update profile with new CV
pnpm dev -- update --pdf ~/cv/new_cv.pdf

# Show current profile
pnpm dev -- profile --show

# Edit profile manually
pnpm dev -- profile --edit

# Interactive mode
pnpm dev -- interactive
```

## Quick reference

| Command | Description |
|---------|-------------|
| `pnpm dev -- init --pdf <path>` | Create profile from PDF |
| `pnpm dev -- update --pdf <path>` | Update profile from new PDF |
| `pnpm dev -- generate "<vacancy>"` | Generate CV for vacancy |
| `pnpm dev -- profile --show` | View current profile |
| `pnpm dev -- profile --edit` | Edit profile in $EDITOR |
| `pnpm dev -- interactive` | Interactive menu mode |

## Project structure

```
cv-adapter/
├── src/
│   ├── domain/           # Core entities (Profile, CVData, errors)
│   ├── application/      # Use cases and commands
│   ├── interfaces/       # Contracts (IParser, IAIProvider, etc)
│   └── infrastructure/    # Adapters (PDF parser, AI providers, etc)
├── templates/
│   └── harvard.ejs       # CV template
├── bin/
│   └── cv                # CLI entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Requirements

- Node.js 18+
- pnpm (https://pnpm.io)

## Troubleshooting

**"No profile found" error**
Run: `pnpm dev -- init --pdf ~/path/to/your/cv.pdf`

**AI errors**
- Check your `AI_API_KEY` in `.env`
- Verify `ACTIVE_PROVIDER` is set correctly
- For Ollama, ensure `ollama serve` is running

**PDF parsing fails**
Ensure your PDF has selectable text (not scanned images)