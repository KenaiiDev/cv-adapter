import { spawn, type SpawnOptions } from 'node:child_process';

export interface EditorChild {
  once(event: 'error', listener: (error: Error) => void): EditorChild;
  once(event: 'close', listener: (code: number | null) => void): EditorChild;
}

export type SpawnProcess = (
  executable: string,
  arguments_: string[],
  options: SpawnOptions,
) => EditorChild;

export class EditorProcess {
  constructor(private readonly start: SpawnProcess = spawn as unknown as SpawnProcess) {}

  async execute(executable: string, arguments_: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const editor = this.start(executable, arguments_, { shell: false, stdio: 'inherit' });
      editor.once('error', reject);
      editor.once('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`Editor exited with code ${code ?? 'unknown'}`));
      });
    });
  }
}
