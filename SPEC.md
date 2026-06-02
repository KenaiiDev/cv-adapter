# CV Adapter - Technical Specification

## 1. Overview

**Type:** CLI tool for generating tailored CVs from job vacancies
**Stack:** Bun + TypeScript
**Storage:** JSON file (`~/.cv-adapter/profile.json`)
**AI:** Multi-provider via `ACTIVE_PROVIDER` env var

## 2. Architecture

```
src/
├── domain/                    # CORE (no dependencies)
│   ├── entities/
│   │   ├── Profile.ts         # User's CV data structure
│   │   └── CVData.ts          # Generated CV output
│   └── errors/
│       └── DomainError.ts     # Custom error class
│
├── application/               # USE CASES
│   ├── commands/              # CLI command handlers
│   │   ├── InitCommand.ts
│   │   ├── UpdateCommand.ts
│   │   ├── GenerateCommand.ts
│   │   └── ProfileCommand.ts
│   └── services/             # Business logic
│       ├── ParseProfile.ts
│       ├── GenerateCV.ts
│       └── RenderCV.ts
│
├── interfaces/               # PORTS (contracts)
│   ├── IParser.ts
│   ├── IAIProvider.ts
│   ├── IProfileRepository.ts
│   ├── IRenderer.ts
│   └── IPDFGenerator.ts
│
└── infrastructure/           # ADAPTERS
    ├── parsers/
    │   └── PDFParser.ts
    ├── repositories/
    │   └── JSONProfileRepository.ts
    ├── ai/
    │   ├── base.ts
    │   ├── GroqAI.ts
    │   ├── GeminiAI.ts
    │   ├── OpenAI.ts
    │   ├── AnthropicAI.ts
    │   └── OllamaAI.ts
    ├── renderer/
    │   └── EJSRenderer.ts
    └── pdf/
        └── HTMLPDFGenerator.ts

templates/
└── harvard.ejs              # Harvard-style CV template
```

## 3. Dependency Rule

```
domain/           →  nothing (pure core)
application/      →  domain (interfaces/types)
interfaces/       →  domain (contracts)
infrastructure/   →  interfaces + domain (implementations)
main.ts           →  application + infrastructure
```

## 4. Domain Entities

### Profile.ts
```typescript
interface Contact {
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
}

interface Experience {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

interface Profile {
  name: string;
  contact: Contact;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  languages: { language: string; level: string }[];
  updated_at: string;
}
```

### CVData.ts
```typescript
interface CVData {
  name: string;
  contact: Contact;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  languages: { language: string; level: string }[];
  generated_at: string;
}
```

## 5. Interfaces (Ports)

### IParser
```typescript
interface IParser {
  parse(filePath: string): Promise<string>;
  toProfile(text: string, name: string): Profile;
}
```

### IAIProvider
```typescript
interface IAIProvider {
  generateCV(profile: Profile, vacancy: string, language: 'es' | 'en'): Promise<CVData>;
  getProviderName(): string;
}
```

### IProfileRepository
```typescript
interface IProfileRepository {
  save(profile: Profile): Promise<void>;
  load(): Promise<Profile | null>;
  exists(): Promise<boolean>;
}
```

### IRenderer
```typescript
interface IRenderer {
  toHTML(cvData: CVData): Promise<string>;
}
```

### IPDFGenerator
```typescript
interface IPDFGenerator {
  generate(html: string, outputPath: string): Promise<void>;
}
```

## 6. AI Providers

| Provider | Model | API Required |
|----------|-------|--------------|
| groq | llama-3.1-70b-versatile | Yes (free tier) |
| gemini | gemini-1.5-flash | Yes |
| openai | gpt-4o-mini | Yes |
| anthropic | claude-3-haiku | Yes |
| ollama | llama3.2 | No (local) |

All providers implement the same `IAIProvider` interface and are swappable via `ACTIVE_PROVIDER` env var.

## 7. Commands

### init
```bash
cv init --pdf <path> --lang <es|en>
```
Parses PDF and creates `~/.cv-adapter/profile.json`

### update
```bash
cv update --pdf <path>
```
Updates existing profile with new PDF data

### generate
```bash
cv generate "<vacancy description>"
```
1. Loads profile
2. Asks for language (es/en)
3. Calls AI provider to generate tailored CV JSON
4. Renders HTML using harvard.ejs template
5. Starts preview server on :8080
6. Opens browser automatically

### profile
```bash
cv profile --show    # Display current profile JSON
cv profile --edit   # Open in $EDITOR
```

### interactive
```bash
cv interactive
```
Menu-driven mode with Inquirer prompts.

## 8. Flow: `cv generate`

```
User runs command with vacancy description
         ↓
Load profile from ~/.cv-adapter/profile.json
         ↓
Ask language via readline prompt
         ↓
Build prompt with: profile JSON + vacancy + Harvard rules
         ↓
Call AI provider (Groq/Gemini/etc) → Get CV JSON response
         ↓
Validate and parse JSON response → CVData
         ↓
Render CVData + harvard.ejs → HTML string
         ↓
Start Express server on :8080 with HTML as response
         ↓
Open browser to http://localhost:8080
         ↓
User clicks "Descargar PDF" button
         ↓
html-pdf-node generates PDF from HTML
         ↓
Browser download dialog appears
```

## 9. Harvard Template Style

- Font: Arial/Helvetica (system sans-serif)
- Header: Name (bold, 24px) + Contact info (right-aligned, small)
- Section titles: UPPERCASE, small (10pt), border-bottom
- Experience: Title (bold) + Company (italic) + Date (right)
- Education: Degree (bold) + Institution (italic) + Year (right)
- Skills: Gray background tags
- Clean whitespace, no colors, no borders, no photo
- A4 page format, optimized for print

## 10. Configuration (.env)

```bash
ACTIVE_PROVIDER=groq    # groq | gemini | openai | anthropic | ollama
AI_API_KEY=your_key_here
```

## 11. Dependencies

```json
{
  "commander": "^12.0.0",     // CLI parsing
  "inquirer": "^9.2.0",        // Interactive prompts
  "pdf-parse": "^1.1.1",       // PDF text extraction
  "ejs": "^3.1.10",            // Template engine
  "html-pdf-node": "^1.0.8",   // HTML to PDF
  "dotenv": "^16.4.0",         // .env management
  "express": "^4.18.0"         // Preview server
}
```

## 12. Error Handling

```typescript
class DomainError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public suggestion?: string
  )
}
```

Error codes: PARSE_ERROR, AI_ERROR, PROFILE_NOT_FOUND, INVALID_LANG, FILE_NOT_FOUND, INVALID_JSON, RENDER_ERROR, PDF_ERROR

## 13. Storage

Location: `~/.cv-adapter/profile.json`

Created automatically on first `cv init`.