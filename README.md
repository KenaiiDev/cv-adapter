# CV Adapter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-8.x-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

CLI en TypeScript que genera CVs adaptados a ofertas de trabajo usando IA. Salida directa en PDF formato Harvard, sin dependencias de navegador.

## Features

- **Multi-provider AI**: Groq, Gemini, OpenAI, Anthropic, Ollama
- **Skills categorizadas** (Languages, Frameworks, Tools, etc.) generadas automáticamente por la IA
- **PDF directo con pdfmake** — no requiere Chromium ni dependencias externas
- **Bilingüe**: español / inglés
- **Perfil reutilizable** almacenado en `~/.cv-adapter/profile.json`
- **Formato Harvard**: limpio, ATS-friendly, optimizado para 1 página

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

> **Variables opcionales por provider** (defaults en `src/infrastructure/ai/`):
> `GROQ_MODEL`, `GEMINI_MODEL`, `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `OLLAMA_MODEL`.

## Usage

> ⚠️ **Importante**: los modos "producción" y "CLI global" requieren haber ejecutado `pnpm build` primero, ya que el binario apunta a `dist/main.js`. En modo desarrollo (`pnpm dev`) no hace falta.

### Modo desarrollo (sin build, recomendado para iterar)

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

# Equivalente abreviado
pnpm start -- init --pdf ~/cv/CV.pdf --lang es
```

### Como CLI global (después de linkear)

```bash
pnpm link --global
cv init --pdf ~/cv/CV.pdf --lang es
cv generate "Senior Python Developer at Mercado Libre"
```

> `npx cv ...` solo funciona si el paquete está publicado en npm **o** si previamente hiciste `pnpm link --global` en este repo.

### Inicializar perfil desde tu CV en PDF

```bash
pnpm dev -- init --pdf ~/cv/CV_Lucas_Villanueva.pdf --lang es
```

### Generar CV para una oferta

```bash
pnpm dev -- generate "Senior Python Developer at Mercado Libre - Requirements: Python, Django, PostgreSQL, 3+ years experience"
```

El comando:
1. Carga tu perfil desde `~/.cv-adapter/profile.json`
2. Pregunta el idioma (es/en) si no se especificó `--lang`
3. Llama a la IA para generar un CV adaptado con skills categorizadas
4. Pregunta el nombre del archivo de salida
5. Genera el PDF directamente y lo guarda en el directorio actual

Ejemplo de output: `cv-senior-python.pdf` en tu working directory.

### Otros comandos

```bash
# Actualizar perfil con un nuevo CV (si no existe, hace init)
pnpm dev -- update --pdf ~/cv/new_cv.pdf

# Ver perfil actual (sin flag también muestra el perfil)
pnpm dev -- profile
pnpm dev -- profile --show

# Editar perfil manualmente (abre $EDITOR, default: nano)
pnpm dev -- profile --edit

# Modo interactivo (menú) — alias: `i`
pnpm dev -- interactive
pnpm dev -- i
```

## Quick reference

| Command | Description |
|---------|-------------|
| `pnpm dev -- init --pdf <path>` | Crear perfil desde PDF |
| `pnpm dev -- init --pdf <path> --lang <es\|en>` | Crear perfil en idioma específico |
| `pnpm dev -- update --pdf <path>` | Actualizar perfil desde nuevo PDF |
| `pnpm dev -- generate "<vacancy>"` | Generar CV adaptado a oferta |
| `pnpm dev -- generate "<vacancy>" --lang <es\|en>` | Generar CV en idioma específico |
| `pnpm dev -- profile` / `--show` | Ver perfil actual |
| `pnpm dev -- profile --edit` | Editar perfil en `$EDITOR` |
| `pnpm dev -- interactive` (alias `i`) | Modo interactivo (menú) |
| `pnpm build` | Compilar TypeScript a `dist/` |
| `pnpm start -- <args>` | Ejecutar versión compilada (`node dist/main.js`) |
| `pnpm test` | Correr suite de tests (Vitest) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:coverage` | Tests con reporte de coverage |

## Project structure

El proyecto sigue **arquitectura hexagonal** (domain / application / infrastructure / interfaces).

```
cv-adapter/
├── src/
│   ├── domain/                       # Entidades core y errores
│   │   ├── entities/                 # Profile, CVData
│   │   ├── errors/                   # DomainError, etc.
│   │   └── index.ts                  # Barrel export
│   ├── application/                  # Casos de uso (orquestación)
│   │   ├── commands/                 # Comandos CLI
│   │   │   ├── InitCommand.ts        # init
│   │   │   ├── UpdateCommand.ts      # update
│   │   │   ├── GenerateCommand.ts    # generate
│   │   │   ├── ProfileCommand.ts     # profile (show / edit)
│   │   │   └── index.ts              # Barrel export
│   │   └── services/                 # Servicios de aplicación
│   │       ├── ParseProfile.ts       # PDF → Profile
│   │       ├── GenerateCV.ts         # Profile + vacancy → CVData
│   │       └── index.ts              # Barrel export
│   ├── interfaces/                   # Contratos (puertos)
│   │   ├── IAIProvider.ts            # Contrato de providers
│   │   ├── IParser.ts                # Contrato de parsers
│   │   ├── IPDFGenerator.ts          # Contrato de generadores PDF
│   │   ├── IProfileRepository.ts     # Contrato de persistencia
│   │   └── Logger.ts                 # Interfaz de logging
│   ├── infrastructure/               # Adaptadores
│   │   ├── ai/                       # Providers + base
│   │   │   ├── base.ts               # BaseAIProvider
│   │   │   ├── GroqAI.ts
│   │   │   ├── GeminiAI.ts
│   │   │   ├── OpenAI.ts
│   │   │   ├── AnthropicAI.ts
│   │   │   ├── OllamaAI.ts
│   │   │   ├── PromptBuilder.ts      # Construcción de prompts
│   │   │   └── schemas.ts            # Zod schemas de validación
│   │   ├── parsers/                  # PDFParser
│   │   ├── pdf/                      # PDFGenerator, CVDataToPdfmakeConverter
│   │   └── repositories/             # JSONProfileRepository
│   ├── types/                        # TypeScript declarations (ambient)
│   └── main.ts                       # Entry point
├── test-data/                        # Mock data para tests
├── tests/                            # Tests (unit + integration)
│   ├── unit/
│   ├── integration/
│   └── helpers/
├── bin/
│   └── cv                            # Wrapper bash (carga .env + ejecuta dist/)
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Tests + build en PRs
│       └── release.yml               # Publica tgz en tags v*
├── package.json
├── tsconfig.json
└── .env.example
```

## Development

### Tests

```bash
pnpm test              # Suite completa (Vitest)
pnpm test:watch        # Modo watch
pnpm test:coverage     # Con reporte de coverage
```

### Path aliases

`tsconfig.json` define los siguientes aliases (resueltos por `tsx` en dev y `tsc` en build):

```ts
import { Profile } from '@domain/entities/Profile';
import { GenerateCV } from '@application/services/GenerateCV';
import type { IAIProvider } from '@interfaces/IAIProvider';
import { GroqAI } from '@infrastructure/ai/GroqAI';
```

Aliases disponibles: `@domain/*`, `@application/*`, `@interfaces/*`, `@infrastructure/*`.

### Build

```bash
pnpm build             # tsc → dist/
```

Output: `dist/main.js` (ejecutable vía `node`, `pnpm start` o `bin/cv`).

## Requirements

- **Node.js 18+** (testeado en 20.x, target ES2022)
- **pnpm 8+** (https://pnpm.io)
- API key de alguno de los providers soportados

## Troubleshooting

**"No profile found" error**

Ejecutá primero: `pnpm dev -- init --pdf ~/path/to/your/cv.pdf`

**`bin/cv` o `cv` (global) falla con "dist/main.js not found"**

Necesitás buildear antes de usar el wrapper: `pnpm build`.

**Errores de IA**

- Verificá que `AI_API_KEY` esté bien configurada en `.env`
- Confirmá que `ACTIVE_PROVIDER` sea uno de: `groq`, `gemini`, `openai`, `anthropic`, `ollama`
- Para Ollama, asegurate de que `ollama serve` esté corriendo en el puerto default
- Si el provider devuelve errores 429/500, probá con `groq` (free y rápido) o ajustá el modelo vía `*_MODEL`

**PDF parsing falla**

Asegurate de que el PDF tenga texto seleccionable (no sea una imagen escaneada). `pdf-parse` no aplica OCR.

**Skills no aparecen categorizadas**

La IA puede no categorizarlas en la primera iteración. Re-generá el CV o ajustá el prompt en `src/infrastructure/ai/PromptBuilder.ts`.

**`cv profile --edit` abre nano y no me gusta**

Seteá la variable de entorno `EDITOR` con tu editor preferido: `export EDITOR=vim`.

## Contributing

Las PRs son bienvenidas. Para cambios grandes:

1. Abrí un issue primero describiendo el cambio
2. Fork + branch (`feature/...` o `fix/...`)
3. Asegurate de que `pnpm test` y `pnpm build` pasen
4. Mantené la arquitectura hexagonal — nuevas fuentes/sinks van en `infrastructure/`, nuevos casos de uso en `application/`

## License

[MIT](LICENSE)
