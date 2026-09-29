import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tsxCli = fileURLToPath(import.meta.resolve('tsx/cli'));
const cliEntry = path.join(projectRoot, 'src/main.ts');

async function runCli(...args: string[]) {
  return execFileAsync(process.execPath, [tsxCli, cliEntry, ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
}

describe('CLI process boundary', () => {
  it('prints help through the source entry point', async () => {
    const result = await runCli('--help');

    expect(result.stdout).toContain('Usage: cv [options] [command]');
    expect(result.stdout).toContain('init');
    expect(result.stderr).toBe('');
  });

  it('prints the package version', async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(projectRoot, 'package.json'), 'utf8'),
    ) as { version: string };

    const result = await runCli('--version');

    expect(result.stdout.trim()).toBe(packageJson.version);
    expect(result.stderr).toBe('');
  });

  it('rejects an unknown command with a diagnostic', async () => {
    await expect(runCli('unknown')).rejects.toMatchObject({
      code: 1,
      stdout: '',
      stderr: expect.stringContaining("error: unknown command 'unknown'"),
    });
  });

  it('rejects init without the required PDF option', async () => {
    await expect(runCli('init')).rejects.toMatchObject({
      code: 1,
      stdout: '',
      stderr: expect.stringContaining(
        "error: required option '--pdf <path>' not specified",
      ),
    });
  });
});
