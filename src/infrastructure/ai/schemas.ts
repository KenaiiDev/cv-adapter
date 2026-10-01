import { z } from 'zod';

export interface AIResponse {
  summary: string;
  experience: Array<{
    profile_index: number;
    description: string;
  }>;
}

export const CVDataSchema = z.object({
  summary: z.string(),
  experience: z.array(
    z.object({
      profile_index: z.number().int().nonnegative(),
      description: z.string(),
    })
  ),
}) satisfies z.ZodType<AIResponse>;

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map(i => `- path ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}
