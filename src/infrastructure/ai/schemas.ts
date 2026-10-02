import { z } from 'zod';

const NonBlankTextSchema = z.string().refine(value => value.trim().length > 0, {
  message: 'Text must not be empty or whitespace-only',
});

export interface AIResponse {
  summary: string;
  experience: Array<{
    profile_index: number;
    description: string;
  }>;
}

export const CVDataSchema = z.object({
  summary: NonBlankTextSchema,
  experience: z.array(
    z.object({
      profile_index: z.number().int().nonnegative(),
      description: NonBlankTextSchema,
    })
  ),
}) satisfies z.ZodType<AIResponse>;

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map(i => `- path ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}
