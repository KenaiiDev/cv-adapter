import type { CVData } from '../../domain/entities/CVData.js';
import type { IRenderer } from '../../interfaces/IRenderer.js';

export class RenderCV {
  private renderer: IRenderer;

  constructor(renderer: IRenderer) {
    this.renderer = renderer;
  }

  async toHTML(cvData: CVData): Promise<string> {
    return this.renderer.toHTML(cvData);
  }
}