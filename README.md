# CV Adapter

CLI en TypeScript que genera CVs adaptados a ofertas de trabajo usando IA. Salida directa en PDF formato Harvard, sin dependencias de navegador.

## Features

- **Multi-provider AI**: Groq, Gemini, OpenAI, Anthropic, Ollama
- **Skills categorizadas** (Languages, Frameworks, Tools, etc.) generadas automáticamente por la IA
- **PDF directo con pdfmake** — no requiere Chromium ni dependencias externas
- **Bilingüe**: español / inglés
- **Perfil reutilizable** almacenado en `~/.cv-adapter/profile.json`
- **Formato Harvard**: limpio, ATS-friendly, 1 página

## Setup

```bash
pnpm install
```

Copiá `.env.example` a `.env` y agregá tu API key:

```bash
cp .env.example .env
```

Obtené tu API key desde:
- **Groq** (recomendado, free): https://console.groq.com
- **Gemini**: https://aistudio.google.com
- **OpenAI**: https://platform.openai.com
- **Anthropic**: https://console.anthropic.com
- **Ollama** (local): https://ollama.ai

Editá `.env`:

```bash
ACTIVE_PROVIDER=groq
AI_API_KEY=your_key_here
```

## Usage

### Modo desarrollo (sin build)

```bash
pnpm dev -- init --pdf ~/cv/CV.pdf --lang es
pnpm dev -- generate "Senior Python Developer at Mercado Libre - Requirements: Python, Django, PostgreSQL"
pnpm dev -- profile --show
```

### Modo producción (después de buildear)

```bash
pnpm build
node dist/main.js init --pdf ~/cv/CV.pdf --lang es
node dist/main.js generate "Senior Python Developer at Mercado Libre"
```

### Como CLI global (después de linkear)

```bash
pnpm link --global
cv init --pdf ~/cv/CV.pdf --lang es
cv generate "Senior Python Developer at Mercado Libre"
```

O usá `npx` (sin linkear):

```bash
npx cv init --pdf ~/cv/CV.pdf --lang es
```

### Inicializar perfil desde tu CV en PDF

```bash
pnpm dev -- init --pdf ~/cv/CV_Lucas_Villanueva.pdf --lang es
```

### Generar CV para una oferta

```bash
pnpm dev -- generate "Senior Python Developer at Mercado Libre - Requirements: Python, Django, PostgreSQL, 3+ years experience"
```

El comando:
1. Carga tu perfil
2. Pregunta el idioma (es/en) si no se especificó
3. Llama a la IA para generar un CV adaptado con skills categorizadas
4. Pregunta el nombre del archivo de salida
5. Genera el PDF directamente y lo guarda en el directorio actual

Ejemplo de output: `cv-senior-python.pdf` en tu working directory.

### Otros comandos

```bash
# Actualizar perfil con un nuevo CV
pnpm dev -- update --pdf ~/cv/new_cv.pdf

# Ver perfil actual
pnpm dev -- profile --show

# Editar perfil manualmente
pnpm dev -- profile --edit

# Modo interactivo (menú)
pnpm dev -- interactive
```

## Quick reference

| Command | Description |
|---------|-------------|
| `pnpm dev -- init --pdf <path>` | Crear perfil desde PDF |
| `pnpm dev -- update --pdf <path>` | Actualizar perfil desde nuevo PDF |
| `pnpm dev -- generate "<vacancy>"` | Generar CV adaptado a oferta |
| `pnpm dev -- profile --show` | Ver perfil actual |
| `pnpm dev -- profile --edit` | Editar perfil en $EDITOR |
| `pnpm dev -- interactive` | Modo interactivo (menú) |

## Project structure

```
cv-adapter/
├── src/
│   ├── domain/                    # Entidades core (Profile, CVData, errors)
│   │   ├── entities/
│   │   └── errors/
│   ├── application/               # Casos de uso
│   │   ├── commands/              # Comandos CLI (Init, Update, Generate, Profile)
│   │   └── services/              # Servicios (GenerateCV, ParseProfile)
│   ├── interfaces/                # Contratos (IAIProvider, IParser, IProfileRepository)
│   ├── infrastructure/            # Adaptadores
│   │   ├── ai/                    # Providers (Groq, Gemini, OpenAI, Anthropic, Ollama)
│   │   ├── parsers/               # PDFParser
│   │   ├── pdf/                   # PDFGenerator, CVDataToPdfmakeConverter
│   │   └── repositories/          # JSONProfileRepository
│   ├── types/                     # TypeScript declarations
│   └── main.ts                    # Entry point
├── test-data/                     # Mock data para tests
├── tests/                         # Tests (unit + integration)
├── package.json
├── tsconfig.json
└── .env.example
```

## Requirements

- Node.js 18+
- pnpm (https://pnpm.io)

## Troubleshooting

**"No profile found" error**

Ejecutá primero: `pnpm dev -- init --pdf ~/path/to/your/cv.pdf`

**Errores de IA**

- Verificá que `AI_API_KEY` esté bien configurada en `.env`
- Confirmá que `ACTIVE_PROVIDER` sea uno de: `groq`, `gemini`, `openai`, `anthropic`, `ollama`
- Para Ollama, asegurate de que `ollama serve` esté corriendo

**PDF parsing falla**

Asegurate de que el PDF tenga texto seleccionable (no sea una imagen escaneada).

**Skills no aparecen categorizadas**

La IA puede no categorizarlas en la primera iteración. Re-generá el CV o ajustá el prompt en `src/infrastructure/ai/`.
