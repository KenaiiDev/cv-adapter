export interface FileWriter {
  write(path: string, content: Buffer): Promise<void>;
}
