export interface IPreviewServer {
  start(): Promise<void>;
  stop(): void;
}

export interface PreviewServerFactory {
  create(html: string): IPreviewServer;
}