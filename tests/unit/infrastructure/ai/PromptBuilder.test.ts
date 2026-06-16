import { describe, it, expect, beforeEach } from 'vitest';
import { PromptBuilder, getCurrentDate, DEFAULT_RULES } from '../../../../src/infrastructure/ai/PromptBuilder.ts';
import { createMockProfile } from '../../../helpers/mockData.ts';

describe('PromptBuilder', () => {
  let builder: PromptBuilder;

  beforeEach(() => {
    builder = new PromptBuilder();
  });

  describe('build', () => {
    it('should include current date in the rules section', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'Senior Developer', 'es', { currentDate: '2026-06-16' });

      expect(prompt).toContain('The current date is 2026-06-16');
    });

    it('should include vacancy text in the prompt', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'Senior Python Developer at Mercado Libre', 'es', { currentDate: '2026-01-01' });

      expect(prompt).toContain('Senior Python Developer at Mercado Libre');
    });

    it('should serialize profile as JSON', () => {
      const profile = createMockProfile({ name: 'Lucas Villanueva' });
      const prompt = builder.build(profile, 'any vacancy', 'es', { currentDate: '2026-01-01' });

      expect(prompt).toContain('"name": "Lucas Villanueva"');
      expect(prompt).toContain('"email": "test@example.com"');
    });

    it('should request Spanish output when language is es', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'vacancy', 'es', { currentDate: '2026-01-01' });

      expect(prompt).toContain('Output in español');
    });

    it('should request English output when language is en', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'vacancy', 'en', { currentDate: '2026-01-01' });

      expect(prompt).toContain('Output in english');
    });

    it('should include the date calculation rule', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'vacancy', 'es', { currentDate: '2026-06-16' });

      expect(prompt).toContain('use this date to calculate the duration of the role in years');
      expect(prompt).toContain('Aggregate total years of experience');
    });

    it('should include the flat-JSON rule', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'vacancy', 'es', { currentDate: '2026-01-01' });

      expect(prompt).toContain('Output MUST be a flat JSON object');
      expect(prompt).toContain('Never return markdown tables');
    });

    it('should include the Actual date normalization rule', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'vacancy', 'es', { currentDate: '2026-01-01' });

      expect(prompt).toContain('keep the string as "Actual" in the output');
    });

    it('should NOT include feedback section when previousError is undefined', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'vacancy', 'es', { currentDate: '2026-01-01' });

      expect(prompt).not.toContain('PREVIOUS ATTEMPT FAILED VALIDATION');
    });

    it('should include feedback section with previousError details', () => {
      const profile = createMockProfile();
      const errorDetails = '- path summary: Required\n- path experience: Expected array';
      const prompt = builder.build(profile, 'vacancy', 'es', {
        currentDate: '2026-01-01',
        previousError: errorDetails,
      });

      expect(prompt).toContain('PREVIOUS ATTEMPT FAILED VALIDATION');
      expect(prompt).toContain('path summary: Required');
      expect(prompt).toContain('path experience: Expected array');
      expect(prompt).toContain('Fix the issues and return valid JSON');
    });

    it('should include the JSON output schema as guidance', () => {
      const profile = createMockProfile();
      const prompt = builder.build(profile, 'vacancy', 'es', { currentDate: '2026-01-01' });

      expect(prompt).toContain('"experience"');
      expect(prompt).toContain('"education"');
      expect(prompt).toContain('"skills"');
      expect(prompt).toContain('"languages"');
    });
  });
});

describe('getCurrentDate', () => {
  it('should return YYYY-MM-DD format', () => {
    const date = getCurrentDate(new Date('2026-06-16T18:30:00.000Z'));
    expect(date).toBe('2026-06-16');
  });

  it('should default to current date when no argument is passed', () => {
    const date = getCurrentDate();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should produce different values for different input dates', () => {
    const a = getCurrentDate(new Date('2026-01-01T00:00:00.000Z'));
    const b = getCurrentDate(new Date('2026-12-31T23:59:59.000Z'));
    expect(a).toBe('2026-01-01');
    expect(b).toBe('2026-12-31');
  });
});

describe('DEFAULT_RULES', () => {
  it('should be an immutable array of strings', () => {
    expect(Array.isArray(DEFAULT_RULES)).toBe(true);
    expect(DEFAULT_RULES.length).toBeGreaterThan(0);
    DEFAULT_RULES.forEach(r => expect(typeof r).toBe('string'));
  });

  it('should contain the current date placeholder', () => {
    const hasDatePlaceholder = DEFAULT_RULES.some(r => r.includes('${currentDate}'));
    expect(hasDatePlaceholder).toBe(true);
  });
});
