import * as fs from 'fs';
import type { FileWriter } from '../../interfaces/FileWriter.js';

export class NodeFileWriter implements FileWriter {
  write(path: string, content: Buffer): Promise<void> {
    return fs.promises.writeFile(path, content);
  }
}
