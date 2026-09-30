import { describe, expect, it, vi } from 'vitest';
import { EditorProcess, type SpawnProcess } from '../../../../src/infrastructure/process/EditorProcess.ts';

describe('EditorProcess', () => {
  it('launches the editor executable with a file argument and never a shell', async () => {
    const child = { once: vi.fn() };
    child.once.mockImplementation((event, listener) => {
      if (event === 'close') listener(0);
      return child;
    });
    const spawn = vi.fn(() => child) as unknown as SpawnProcess;

    await new EditorProcess(spawn).execute('editor; touch unsafe', ['/tmp/profile.json']);

    expect(spawn).toHaveBeenCalledWith(
      'editor; touch unsafe',
      ['/tmp/profile.json'],
      { shell: false, stdio: 'inherit' },
    );
  });

  it('rejects when the editor exits unsuccessfully', async () => {
    const child = { once: vi.fn() };
    child.once.mockImplementation((event, listener) => {
      if (event === 'close') listener(1);
      return child;
    });
    const spawn = vi.fn(() => child) as unknown as SpawnProcess;

    await expect(new EditorProcess(spawn).execute('nano', ['/tmp/profile.json']))
      .rejects.toThrow('Editor exited with code 1');
  });
});
