import * as fs from 'fs';
import * as path from 'path';
import type { CVData } from '../../domain/entities/CVData.js';
import type { IRenderer } from '../../interfaces/IRenderer.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class EJSRenderer implements IRenderer {
  private getTemplatePath(): string {
    const projectRoot = path.resolve(import.meta.dirname, '../..');
    return path.join(projectRoot, 'templates', 'harvard.ejs');
  }

  async toHTML(cvData: CVData): Promise<string> {
    try {
      const templatePath = this.getTemplatePath();
      const template = await fs.promises.readFile(templatePath, 'utf-8');

      const ejs = await import('ejs');
      return ejs.render(template, { cv: cvData });
    } catch (error) {
      throw new DomainError(
        'Failed to render template',
        'RENDER_ERROR',
        'Check that templates/harvard.ejs exists'
      );
    }
  }
}

export const renderer = new EJSRenderer();