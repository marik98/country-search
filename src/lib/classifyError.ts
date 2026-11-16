import { HttpError } from './errors.js';

export type ErrorKind = 'abort' | 'timeout' | 'http' | 'network';

export interface ClassifiedError {
  kind: ErrorKind;
  status?: number;
  message: string;
}

export function classifyError(err: unknown): ClassifiedError {
  if (err instanceof DOMException) {
    if (err.name === 'AbortError') {
      return { kind: 'abort', message: 'Request was cancelled' };
    }
    if (err.name === 'TimeoutError') {
      return { kind: 'timeout', message: 'Request timed out' };
    }
  }
  if (err instanceof HttpError) {
    return { kind: 'http', status: err.status, message: `Server error (${err.status})` };
  }
  return { kind: 'network', message: 'Network error — check your connection' };
}
