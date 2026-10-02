import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CVData } from '../../../../src/domain/entities/CVData.ts';

const { prompt } = vi.hoisted(() => ({ prompt: vi.fn() }));

vi.mock('inquirer', () => ({
  default: { prompt },
}));

import { InquirerGeneratedCVReview } from '../../../../src/infrastructure/confirmation/InquirerGeneratedCVReview.ts';
import { formatCVPreview } from '../../../../src/application/services/FormatCVPreview.ts';

describe('InquirerGeneratedCVReview', () => {
  const cvData: CVData = {
    name: 'Ada Lovelace',
    contact: { email: 'ada@example.com' },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    summary: 'Mathematician and software pioneer.',
    generated_at: '2024-02-01T00:00:00.000Z',
  };
  const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true });
    prompt.mockResolvedValue({ approved: true });
    log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalIsTTY) {
      Object.defineProperty(process.stdin, 'isTTY', originalIsTTY);
    } else {
      Reflect.deleteProperty(process.stdin, 'isTTY');
    }
    log.mockRestore();
    prompt.mockReset();
  });

  it('emits the formatted preview before asking for approval', async () => {
    const review = new InquirerGeneratedCVReview();

    await review.review(cvData);

    expect(log).toHaveBeenCalledWith(`\n${formatCVPreview(cvData)}\n`);
  });

  it('defaults approval to false', async () => {
    const review = new InquirerGeneratedCVReview();

    await review.review(cvData);

    expect(prompt).toHaveBeenCalledWith([
      expect.objectContaining({ default: false }),
    ]);
  });

  it('rejects without emitting or prompting when standard input is not a TTY', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: false });
    const review = new InquirerGeneratedCVReview();

    await expect(review.review(cvData)).resolves.toBe(false);

    expect(log).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
  });
});
