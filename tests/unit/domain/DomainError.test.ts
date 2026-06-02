import { describe, it, expect } from 'vitest';
import { DomainError, type ErrorCode } from '../../../src/domain/errors/DomainError.ts';

describe('DomainError', () => {
  describe('constructor', () => {
    it('should set message correctly', () => {
      const error = new DomainError('Test error message', 'PARSE_ERROR');
      expect(error.message).toBe('Test error message');
    });

    it('should set code correctly', () => {
      const error = new DomainError('Test', 'AI_ERROR');
      expect(error.code).toBe('AI_ERROR');
    });

    it('should set suggestion when provided', () => {
      const error = new DomainError('Test', 'FILE_NOT_FOUND', 'Check the file path');
      expect(error.suggestion).toBe('Check the file path');
    });

    it('should have name as DomainError', () => {
      const error = new DomainError('Test', 'PARSE_ERROR');
      expect(error.name).toBe('DomainError');
    });

    it('should be instance of Error', () => {
      const error = new DomainError('Test', 'PARSE_ERROR');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('toString', () => {
    it('should include error message with emoji', () => {
      const error = new DomainError('Something went wrong', 'AI_ERROR');
      expect(error.toString()).toContain('❌ Error: Something went wrong');
    });

    it('should include error code', () => {
      const error = new DomainError('Test', 'RENDER_ERROR');
      expect(error.toString()).toContain('Code: RENDER_ERROR');
    });

    it('should include suggestion when present', () => {
      const error = new DomainError('Test', 'PARSE_ERROR', 'Verify your PDF file');
      const str = error.toString();
      expect(str).toContain('Suggestion: Verify your PDF file');
    });

    it('should not include suggestion line when suggestion is undefined', () => {
      const error = new DomainError('Test', 'PARSE_ERROR');
      const str = error.toString();
      expect(str).not.toContain('Suggestion:');
    });

    it('should format suggestion on new line with indentation', () => {
      const error = new DomainError('Test', 'INVALID_JSON', 'Valid JSON required');
      const str = error.toString();
      expect(str).toContain('\n   Suggestion: Valid JSON required');
    });
  });

  describe('all error codes', () => {
    const errorCodes: ErrorCode[] = [
      'PARSE_ERROR',
      'AI_ERROR',
      'PROFILE_NOT_FOUND',
      'INVALID_LANG',
      'FILE_NOT_FOUND',
      'INVALID_JSON',
      'RENDER_ERROR',
      'PDF_ERROR',
    ];

    it.each(errorCodes)('should support error code: %s', (code) => {
      const error = new DomainError('Test', code);
      expect(error.code).toBe(code);
    });

    it('should have 8 total error codes', () => {
      expect(errorCodes).toHaveLength(8);
    });
  });

  describe('DomainError scenarios', () => {
    it('should handle PARSE_ERROR with suggestion', () => {
      const error = new DomainError(
        'No se pudo leer el PDF',
        'PARSE_ERROR',
        'Verificá que el PDF tenga texto seleccionable'
      );
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.toString()).toContain('Verificá que el PDF');
    });

    it('should handle AI_ERROR without suggestion', () => {
      const error = new DomainError('API key inválida', 'AI_ERROR');
      expect(error.code).toBe('AI_ERROR');
      expect(error.suggestion).toBeUndefined();
      expect(error.toString()).not.toContain('Suggestion:');
    });

    it('should handle PROFILE_NOT_FOUND', () => {
      const error = new DomainError(
        'No profile found',
        'PROFILE_NOT_FOUND',
        'Run cv init --pdf <path>'
      );
      expect(error.toString()).toContain('Run cv init --pdf <path>');
    });

    it('should handle FILE_NOT_FOUND', () => {
      const error = new DomainError(
        'File not found: /path/to/file.pdf',
        'FILE_NOT_FOUND',
        'Check the path to your PDF file'
      );
      expect(error.toString()).toContain('File not found: /path/to/file.pdf');
      expect(error.toString()).toContain('Check the path');
    });
  });
});