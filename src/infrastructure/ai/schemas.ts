import { z } from 'zod';
import type { CVData } from '../../domain/entities/CVData.js';

export type AIResponse = Omit<CVData, 'generated_at'>;

export const CVDataSchema = z.object({
  name: z.string().min(1),
  contact: z.object({
    email: z.string().min(1),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }),
  summary: z.string(),
  experience: z.array(
    z.object({
      title: z.string().min(1),
      company: z.string().min(1),
      start_date: z.string().min(1),
      end_date: z.string().min(1),
      description: z.string(),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string().min(1),
      institution: z.string().min(1),
      year: z.string().min(1),
      description: z.string().optional(),
    })
  ),
  skills: z.array(
    z.object({
      category: z.string().min(1),
      items: z.array(z.string().min(1)).min(1),
    })
  ),
  languages: z.array(
    z.object({
      language: z.string().min(1),
      level: z.string().min(1),
    })
  ),
}) satisfies z.ZodType<AIResponse>;

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map(i => `- path ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}

