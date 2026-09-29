import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tsxCli = fileURLToPath(import.meta.resolve('tsx/cli'));
const cliEntry = path.join(projectRoot, 'src/main.ts');

async function runCli(args: string[], environment: NodeJS.ProcessEnv = process.env) {
  return execFileAsync(process.execPath, [tsxCli, cliEntry, ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: environment,
  });
}

describe('CLI process boundary', () => {
  it('prints help through the source entry point', async () => {
    const result = await runCli(['--help']);

    expect(result.stdout).toContain('Usage: cv [options] [command]');
    expect(result.stdout).toContain('init');
    expect(result.stderr).toBe('');
  });

  it('prints the package version', async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(projectRoot, 'package.json'), 'utf8'),
    ) as { version: string };

    const result = await runCli(['--version']);

    expect(result.stdout.trim()).toBe(packageJson.version);
    expect(result.stderr).toBe('');
  });

  it('rejects an unknown command with a diagnostic', async () => {
    await expect(runCli(['unknown'])).rejects.toMatchObject({
      code: 1,
      stdout: '',
      stderr: expect.stringContaining("error: unknown command 'unknown'"),
    });
  });

  it('rejects init without the required PDF option', async () => {
    await expect(runCli(['init'])).rejects.toMatchObject({
      code: 1,
      stdout: '',
      stderr: expect.stringContaining(
        "error: required option '--pdf <path>' not specified",
      ),
    });
  });

  it('exposes explicit approval for non-interactive profile updates', async () => {
    const result = await runCli(['update', '--help']);

    expect(result.stdout).toContain('--yes');
  });

  it('exposes explicit approval for staged manual profile edits', async () => {
    const result = await runCli(['profile', '--help']);

    expect(result.stdout).toContain('--edit');
    expect(result.stdout).toContain('--yes');
  });

  it('removes staged edits before exiting after a real editor failure', async () => {
    const home = await mkdtemp(path.join(tmpdir(), 'cv-adapter-cli-home-'));
    const profileDirectory = path.join(home, '.cv-adapter');
    const failingEditor = path.join(home, 'failing-editor.mjs');
    await mkdir(profileDirectory);
    await writeFile(path.join(profileDirectory, 'profile.json'), JSON.stringify({
      name: 'Current User',
      contact: { email: 'current@example.com' },
      experience: [],
      education: [],
      skills: [],
      languages: [],
      updated_at: '2024-01-01',
    }));
    await writeFile(failingEditor, '#!/usr/bin/env node\nprocess.exit(1);\n');
    await chmod(failingEditor, 0o755);

    try {
      await expect(runCli(['profile', '--edit', '--yes'], {
        ...process.env,
        EDITOR: failingEditor,
        HOME: home,
      })).rejects.toMatchObject({ code: 1 });

      expect((await readdir(profileDirectory)).filter(entry => entry.startsWith('.profile-edit-')))
        .toEqual([]);
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });
});
