import type { Profile } from '../../domain/entities/Profile.js';
import type { Language } from '../../interfaces/IAIProvider.js';

export const DEFAULT_RULES: readonly string[] = [
  'Extract and adapt relevant experience/skills for the vacancy',
  'Use keywords from the vacancy naturally',
  'Rewrite descriptions to highlight achievements and impact',
  'Keep it concise and professional',
  'Follow Harvard style (clean, simple, no colors)',
  'The current date is ${currentDate}. Use profile dates only to calculate experience duration; do not invent dates or factual claims.',
  'Output MUST be a flat JSON object. Never return markdown tables, code fences, or any wrapper. If a section in the source profile contains tabular data, flatten it to a single string per field.',
  'Tailor only the summary and experience descriptions. Do not return identity, contact, company, title, date, education, skill, or language fields.',
  'For each tailored experience description, use the zero-based profile_index of the matching experience from the source profile.',
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
  "summary": "Professional summary tailored to the vacancy",
  "experience": [{ "profile_index": 0, "description": "Tailored description for the first profile experience" }]
}`;
  }
}

export function getCurrentDate(now: Date = new Date()): string {
  return now.toISOString().split('T')[0];
}
