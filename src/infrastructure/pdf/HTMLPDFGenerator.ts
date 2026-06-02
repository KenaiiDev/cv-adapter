import type { IPDFGenerator } from '../../interfaces/IPDFGenerator.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class HTMLPDFGenerator implements IPDFGenerator {
  async generate(html: string, outputPath: string): Promise<void> {
    try {
      const htmlPdf = await import('html-pdf-node');

      const file = {
        content: html,
      };

      const options = {
        path: outputPath,
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      };

      await htmlPdf.fileToPdf(file, options);
    } catch (error) {
      throw new DomainError(
        'Failed to generate PDF',
        'PDF_ERROR',
        'Check if html-pdf-node is properly installed'
      );
    }
  }
}

export const pdfGenerator = new HTMLPDFGenerator();