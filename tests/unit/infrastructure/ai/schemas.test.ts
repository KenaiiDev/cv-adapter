import { describe, it, expect } from 'vitest';
import { CVDataSchema, formatZodError } from '../../../../src/infrastructure/ai/schemas.ts';
import { createMockCVData } from '../../../helpers/mockData.ts';

describe('CVDataSchema', () => {
  describe('valid payloads', () => {
    it('should accept a complete valid CVData', () => {
      const cv = createMockCVData();
      const { generated_at, ...aiResponse } = cv;
      const result = CVDataSchema.safeParse(aiResponse);
      expect(result.success).toBe(true);
    });

    it('should accept empty arrays for experience, education, skills, languages', () => {
      const cv = createMockCVData({
        experience: [],
        education: [],
        skills: [],
        languages: [],
      });
      const { generated_at, ...aiResponse } = cv;
      const result = CVDataSchema.safeParse(aiResponse);
      expect(result.success).toBe(true);
    });

    it('should accept contact without optional fields', () => {
      const cv = createMockCVData({
        contact: { email: 'a@b.com' },
      });
      const { generated_at, ...aiResponse } = cv;
      const result = CVDataSchema.safeParse(aiResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid payloads', () => {
    it('should reject when name is empty', () => {
      const cv = createMockCVData({ name: '' });
      const { generated_at, ...aiResponse } = cv;
      const result = CVDataSchema.safeParse(aiResponse);
      expect(result.success).toBe(false);
    });

    it('should reject when summary is missing', () => {
      const cv = createMockCVData();
      const { generated_at, summary, ...rest } = cv;
      const result = CVDataSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject when experience has an entry with empty title', () => {
      const cv = createMockCVData({
        experience: [{ title: '', company: 'X', start_date: '2020', end_date: 'Actual', description: 'd' }],
      });
      const { generated_at, ...aiResponse } = cv;
      const result = CVDataSchema.safeParse(aiResponse);
      expect(result.success).toBe(false);
    });

    it('should reject when skills contains a category with empty items', () => {
      const cv = createMockCVData({
        skills: [{ category: 'Languages', items: [] }],
      });
      const { generated_at, ...aiResponse } = cv;
      const result = CVDataSchema.safeParse(aiResponse);
      expect(result.success).toBe(false);
    });

    it('should reject when education has empty year', () => {
      const cv = createMockCVData({
        education: [{ degree: 'CS', institution: 'UBA', year: '' }],
      });
      const { generated_at, ...aiResponse } = cv;
      const result = CVDataSchema.safeParse(aiResponse);
      expect(result.success).toBe(false);
    });

    it('should reject completely malformed input (string)', () => {
      const result = CVDataSchema.safeParse('not an object');
      expect(result.success).toBe(false);
    });

    it('should reject null', () => {
      const result = CVDataSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined', () => {
      const result = CVDataSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });
});

describe('formatZodError', () => {
  it('should format a single issue with path and message', () => {
    const result = CVDataSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (result.success) return;
    const formatted = formatZodError(result.error);
    expect(formatted).toMatch(/^- path name: /);
  });

  it('should format multiple issues separated by newlines', () => {
    const result = CVDataSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    const formatted = formatZodError(result.error);
    const lines = formatted.split('\n');
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach(l => expect(l).toMatch(/^- path .+: /));
  });

  it('should use (root) for issues at the root level', () => {
    const result = CVDataSchema.safeParse(42);
    expect(result.success).toBe(false);
    if (result.success) return;
    const formatted = formatZodError(result.error);
    expect(formatted).toContain('(root)');
  });

  it('should format nested paths with dot notation', () => {
    const cv = createMockCVData({
      experience: [{ title: '', company: 'X', start_date: '2020', end_date: 'Actual', description: 'd' }],
    });
    const { generated_at, ...aiResponse } = cv;
    const result = CVDataSchema.safeParse(aiResponse);
    expect(result.success).toBe(false);
    if (result.success) return;
    const formatted = formatZodError(result.error);
    expect(formatted).toMatch(/experience\.0\.title/);
  });
});
