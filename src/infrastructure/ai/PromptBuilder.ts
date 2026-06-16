import type { Profile } from '../../domain/entities/Profile.js';
import type { Language } from '../../interfaces/IAIProvider.js';

export const DEFAULT_RULES: readonly string[] = [
  'Extract and adapt relevant experience/skills for the vacancy',
  'Use keywords from the vacancy naturally',
  'Rewrite descriptions to highlight achievements and impact',
  'Keep it concise and professional',
  'Follow Harvard style (clean, simple, no colors)',
  'The current date is ${currentDate}. For ongoing roles (end_date = "Actual" / "Present" / "Now" / "Current"), use this date to calculate the duration of the role in years. Aggregate total years of experience across all roles and report the aggregate in the summary.',
  'Output MUST be a flat JSON object. Never return markdown tables, code fences, or any wrapper. If a section in the source profile contains tabular data, flatten it to a single string per field.',
  'For "end_date" values that are "Actual", "Present", "Now", or "Current", keep the string as "Actual" in the output. Do not invent dates.',
];

export interface PromptOptions {
  currentDate: string;
  previousError?: string;
}

export class PromptBuilder {
  build(profile: Profile, vacancy: string, language: Language, options: PromptOptions): string {
    const langLabel = language === 'es' ? 'español' : 'english';
    const profileJSON = JSON.stringify(profile, null, 2);
    const rulesText = DEFAULT_RULES
      .map(rule => `- ${rule.replace('${currentDate}', options.currentDate)}`)
      .join('\n');

    const feedbackSection = options.previousError
      ? `

PREVIOUS ATTEMPT FAILED VALIDATION. The following issues were detected in your last response:
${options.previousError}

Fix the issues and return valid JSON that satisfies the schema below.`
      : '';

    return `You are an expert CV writer specializing in Harvard-style resumes.

Generate a tailored CV based on the user's profile and the job vacancy.
Output ONLY valid JSON, no markdown, no explanations.${feedbackSection}

Rules:
${rulesText}
- Output in ${langLabel}

User Profile (JSON):
${profileJSON}

Job Vacancy:
${vacancy}

Output format (JSON only):
{
  "name": "Full Name",
  "contact": { "email": "...", "phone": "...", "location": "...", "linkedin": "...", "github": "..." },
  "summary": "Professional summary tailored to the vacancy",
  "experience": [{ "title": "...", "company": "...", "start_date": "...", "end_date": "...", "description": "..." }],
  "education": [{ "degree": "...", "institution": "...", "year": "...", "description": "..." }],
  "skills": [
    { "category": "Lenguajes", "items": ["JavaScript", "TypeScript"] },
    { "category": "Frameworks", "items": ["React", "Node.js"] }
  ],
  "languages": [{ "language": "...", "level": "..." }]
}`;
  }
}

export function getCurrentDate(now: Date = new Date()): string {
  return now.toISOString().split('T')[0];
}
