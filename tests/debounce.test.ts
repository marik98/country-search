import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../src/lib/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not invoke fn before the delay elapses', () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d('a');
    expect(fn).not.toHaveBeenCalled();
  });

  it('invokes fn once after the delay with last args', () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d('a');
    d('b');
    d('c');
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('c');
  });

  it('resets timer when called again during the wait', () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d('a');
    vi.advanceTimersByTime(200);
    d('b');
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('allows multiple independent invocations after quiet period', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('a');
    vi.advanceTimersByTime(100);
    d('b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenNthCalledWith(1, 'a');
    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });
});
