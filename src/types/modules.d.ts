declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
  }
  function pdf(dataBuffer: Buffer): Promise<PDFData>;
  export = pdf;
}

declare module 'html-pdf-node' {
  interface File {
    content: string;
    url?: string;
  }
  interface Options {
    format?: 'A4' | 'Letter' | 'Legal';
    printBackground?: boolean;
    margin?: {
      top?: string;
      bottom?: string;
      left?: string;
      right?: string;
    };
  }
  function fileToPdf(file: File, options?: Options): Promise<Buffer>;
  export = { fileToPdf };
}

declare module 'open' {
  interface OpenOptions {
    app?: string | string[];
  }
  function open(url: string, options?: OpenOptions): Promise<{ pid: number }>;
  export = open;
}