import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseAIProvider } from '../../../../src/infrastructure/ai/base.ts';
import type { Profile } from '../../../../src/domain/entities/Profile.ts';
import type { CVData } from '../../../../src/domain/entities/CVData.ts';
import type { Language } from '../../../../src/interfaces/IAIProvider.ts';
import { createMockProfile } from '../../../helpers/mockData.ts';
import { DomainError } from '../../../../src/domain/errors/DomainError.ts';

function createAIResponse() {
  return {
    summary: 'Tailored summary from AI',
    experience: [{ profile_index: 0, description: 'Tailored first experience description' }],
  };
}

class TestProvider extends BaseAIProvider {
  public callAPICalls: string[] = [];
  public buildPromptCalls: Array<{ previousError: string | undefined }> = [];

  constructor(
    private responses: string[],
    private parsedValues: unknown[]
  ) {
    super();
  }

  getProviderName(): string {
    return 'test';
  }

  getModel(): string {
    return 'test-model';
  }

  getEndpoint(): string {
    return 'https://test.example/v1/chat';
  }

  protected buildPrompt(
    _profile: Profile,
    _vacancy: string,
    _language: Language,
    options: { currentDate: string; previousError?: string }
  ): string {
    this.buildPromptCalls.push({ previousError: options.previousError });
    return `PROMPT(date=${options.currentDate},err=${options.previousError ?? 'none'})`;
  }

  protected async callAPI(prompt: string): Promise<string> {
    this.callAPICalls.push(prompt);
    const idx = this.callAPICalls.length - 1;
    if (idx >= this.responses.length) {
      throw new Error(`No mock response for call #${idx + 1}`);
    }
    return this.responses[idx];
  }

  protected parseResponse(content: string): Partial<CVData> {
    const idx = this.callAPICalls.length - 1;
    if (idx >= this.parsedValues.length) {
      throw new Error(`No mock parsed value for call #${idx + 1}`);
    }
    return this.parsedValues[idx] as Partial<CVData>;
  }
}

describe('BaseAIProvider', () => {
  let profile: Profile;

  beforeEach(() => {
    profile = createMockProfile();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('happy path', () => {
    it('should return CVData on first valid attempt without retry', async () => {
      const provider = new TestProvider(['raw'], [createAIResponse()]);

      const result = await provider.generateCV(profile, 'Senior Python Developer', 'es');

      expect(result.name).toBe('Test User');
      expect(result.summary).toBeTruthy();
      expect(result.generated_at).toBe('2026-06-16T12:00:00.000Z');
      expect(provider.callAPICalls).toHaveLength(1);
      expect(provider.buildPromptCalls).toHaveLength(1);
      expect(provider.buildPromptCalls[0].previousError).toBeUndefined();
    });

    it('should assemble immutable profile facts with AI-tailored narrative content', async () => {
      const provider = new TestProvider(['raw'], [{
        name: 'Invented Name',
        contact: { email: 'invented@example.com' },
        summary: 'Tailored summary for the vacancy',
        experience: [
          {
            profile_index: 0,
            description: 'Tailored description for the first role',
            title: 'Invented Title',
            company: 'Invented Company',
            start_date: '1900',
            end_date: '1901',
          },
        ],
        education: [],
        skills: [],
        languages: [],
      }]);

      const result = await provider.generateCV(profile, 'vacancy', 'es');

      expect(result.name).toBe(profile.name);
      expect(result.contact).toEqual(profile.contact);
      expect(result.experience).toEqual([
        { ...profile.experience[0], description: 'Tailored description for the first role' },
        profile.experience[1],
      ]);
      expect(result.education).toEqual(profile.education);
      expect(result.skills).toEqual(profile.skills);
      expect(result.languages).toEqual(profile.languages);
      expect(result.summary).toBe('Tailored summary for the vacancy');
    });

    it('should preserve profile descriptions not tailored by AI', async () => {
      const provider = new TestProvider(['raw'], [{ summary: 'Tailored summary from AI', experience: [] }]);

      const result = await provider.generateCV(profile, 'vacancy', 'es');

      expect(result.name).toBe(profile.name);
      expect(result.contact).toEqual(profile.contact);
      expect(result.summary).toBe('Tailored summary from AI');
      expect(result.experience).toEqual(profile.experience);
      expect(result.skills).toEqual(profile.skills);
      expect(provider.callAPICalls).toHaveLength(1);
    });
  });

  describe('retry behavior', () => {
    it('should retry once when first attempt fails Zod validation', async () => {
      const invalid = { name: '' };
      const provider = new TestProvider(['raw1', 'raw2'], [invalid, createAIResponse()]);

      const result = await provider.generateCV(profile, 'vacancy', 'es');

      expect(result.name).toBe('Test User');
      expect(provider.callAPICalls).toHaveLength(2);
      expect(provider.buildPromptCalls).toHaveLength(2);
      expect(provider.buildPromptCalls[0].previousError).toBeUndefined();
      expect(provider.buildPromptCalls[1].previousError).toBeDefined();
      expect(provider.buildPromptCalls[1].previousError).toContain('path summary');
    });

    it('should inject the previous error in the second prompt', async () => {
      const invalid = { name: '' };
      const provider = new TestProvider(['raw1', 'raw2'], [invalid, createAIResponse()]);

      await provider.generateCV(profile, 'vacancy', 'es');

      const secondPrompt = provider.callAPICalls[1];
      expect(secondPrompt).toContain('err=');
      expect(secondPrompt).not.toContain('err=none');
    });

    it('should not retry a third time when both attempts fail', async () => {
      const invalid1 = { name: '' };
      const invalid2 = { summary: '' };
      const provider = new TestProvider(['raw1', 'raw2'], [invalid1, invalid2]);

      await expect(provider.generateCV(profile, 'vacancy', 'es')).rejects.toThrow(DomainError);

      expect(provider.callAPICalls).toHaveLength(2);
    });

    it('should throw DomainError with code AI_VALIDATION when both attempts fail', async () => {
      const invalid1 = { name: '' };
      const invalid2 = { name: '' };
      const provider = new TestProvider(['raw1', 'raw2'], [invalid1, invalid2]);

      try {
        await provider.generateCV(profile, 'vacancy', 'es');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(DomainError);
        expect((err as DomainError).code).toBe('AI_VALIDATION');
        expect((err as DomainError).message).toContain('2 attempts');
      }
    });

    it('should attach the last validation error as suggestion', async () => {
      const invalid1 = { name: 'A' };
      const invalid2 = { name: '' };
      const provider = new TestProvider(['raw1', 'raw2'], [invalid1, invalid2]);

      try {
        await provider.generateCV(profile, 'vacancy', 'es');
        expect.fail('should have thrown');
      } catch (err) {
        expect((err as DomainError).suggestion).toBeDefined();
        expect((err as DomainError).suggestion).toContain('path summary');
      }
    });
  });

  describe('prompt options', () => {
    it('should inject a fresh currentDate on each attempt (no caching)', async () => {
      const provider = new TestProvider(['raw1', 'raw2'], [{ name: '' }, createAIResponse()]);

      vi.setSystemTime(new Date('2026-06-16T00:00:00.000Z'));
      const promise = provider.generateCV(profile, 'vacancy', 'es');

      await vi.advanceTimersByTimeAsync(0);
      const result = await promise;

      expect(result).toBeDefined();
      expect(provider.callAPICalls[0]).toContain('date=2026-06-16');
      expect(provider.callAPICalls[1]).toContain('date=2026-06-16');
    });

    it('should pass currentDate matching runtime date in single-attempt success', async () => {
      vi.setSystemTime(new Date('2025-11-30T08:00:00.000Z'));
      const provider = new TestProvider(['raw'], [createAIResponse()]);

      await provider.generateCV(profile, 'vacancy', 'es');

      expect(provider.callAPICalls[0]).toContain('date=2025-11-30');
    });
  });

  describe('malformed JSON', () => {
    it('should treat parse failure (non-object) as a Zod failure and retry', async () => {
      const provider = new TestProvider(['raw1', 'raw2'], [42, createAIResponse()]);

      const result = await provider.generateCV(profile, 'vacancy', 'es');

      expect(result.name).toBe('Test User');
      expect(provider.callAPICalls).toHaveLength(2);
    });
  });
});
