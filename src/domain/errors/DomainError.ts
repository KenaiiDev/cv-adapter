export type ErrorCode =
  | 'PARSE_ERROR'
  | 'AI_ERROR'
  | 'AI_VALIDATION'
  | 'PROFILE_NOT_FOUND'
  | 'INVALID_LANG'
  | 'FILE_NOT_FOUND'
  | 'INVALID_JSON'
  | 'RENDER_ERROR'
  | 'PDF_ERROR';

export class DomainError extends Error {
  public code: ErrorCode;
  public suggestion?: string;

  constructor(message: string, code: ErrorCode, suggestion?: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.suggestion = suggestion;
  }

  toString(): string {
    let result = `❌ Error: ${this.message}\n   Code: ${this.code}`;
    if (this.suggestion) {
      result += `\n   Suggestion: ${this.suggestion}`;
    }
    return result;
  }
}