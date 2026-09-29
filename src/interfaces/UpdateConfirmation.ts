export interface UpdateConfirmation {
  isInteractive(): boolean;
  confirm(message: string): Promise<boolean>;
}
