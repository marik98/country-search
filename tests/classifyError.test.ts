import { describe, it, expect } from 'vitest';
import { classifyError } from '../src/lib/classifyError';
import { HttpError } from '../src/lib/errors';

describe('classifyError', () => {
  it('classifies AbortError as abort (our own cancellation)', () => {
    const err = new DOMException('aborted', 'AbortError');
    expect(classifyError(err)).toEqual({ kind: 'abort', message: expect.any(String) });
  });

  it('classifies TimeoutError as timeout (real error)', () => {
    const err = new DOMException('timed out', 'TimeoutError');
    expect(classifyError(err)).toEqual({ kind: 'timeout', message: expect.any(String) });
  });

  it('classifies HttpError as http and preserves status', () => {
    const err = new HttpError(502);
    expect(classifyError(err)).toEqual({ kind: 'http', status: 502, message: expect.any(String) });
  });

  it('classifies unknown errors as network', () => {
    expect(classifyError(new TypeError('Failed to fetch')).kind).toBe('network');
  });

  it('distinguishes abort from timeout explicitly', () => {
    const abort = classifyError(new DOMException('', 'AbortError'));
    const timeout = classifyError(new DOMException('', 'TimeoutError'));
    expect(abort.kind).not.toBe(timeout.kind);
  });
});
