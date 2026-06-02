export interface IPDFGenerator {
  generate(html: string, outputPath: string): Promise<void>;
}