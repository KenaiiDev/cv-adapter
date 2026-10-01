import { describe, it, expect } from 'vitest';
import { CVDataSchema, formatZodError } from '../../../../src/infrastructure/ai/schemas.ts';

describe('CVDataSchema', () => {
  it('should accept summary and profile-indexed experience descriptions', () => {
    const result = CVDataSchema.safeParse({
      summary: 'Tailored summary',
      experience: [{ profile_index: 0, description: 'Tailored description' }],
    });

    expect(result.success).toBe(true);
  });

  it('should strip AI-provided factual fields from the constrained response', () => {
    const result = CVDataSchema.safeParse({
      name: 'Invented Name',
      contact: { email: 'invented@example.com' },
      summary: 'Tailored summary',
      experience: [{ profile_index: 0, description: 'Tailored description', title: 'Invented Title' }],
      education: [],
    });

    expect(result).toEqual({
      success: true,
      data: {
        summary: 'Tailored summary',
        experience: [{ profile_index: 0, description: 'Tailored description' }],
      },
    });
  });

  it('should reject a response missing the summary', () => {
    const result = CVDataSchema.safeParse({ experience: [] });

    expect(result.success).toBe(false);
  });

  it('should reject a fractional profile experience index', () => {
    const result = CVDataSchema.safeParse({
      summary: 'Tailored summary',
      experience: [{ profile_index: 0.5, description: 'Tailored description' }],
    });

    expect(result.success).toBe(false);
  });
});

describe('formatZodError', () => {
  it('should format a validation issue with its path and message', () => {
    const result = CVDataSchema.safeParse({ experience: [] });
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(formatZodError(result.error)).toMatch(/^- path summary: /);
  });
});
