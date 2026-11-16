import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchController } from '../src/app/searchController';
import type { AppState } from '../src/app/state';

const SPAIN = {
  name: 'Spain',
  flag: '🇪🇸',
  capital: 'Madrid',
  region: 'Europe',
  population: 1,
};
const SP = { name: 'Sp', flag: '🏳️', capital: '', region: '', population: 0 };

interface Pending {
  url: string;
  resolve: () => void;
  reject: (e: unknown) => void;
}

// Мок fetch, который реагирует на AbortSignal
function makeAbortAwareFetch(records: Map<string, Pending>) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const signal = init?.signal ?? undefined;

    return new Promise<Response>((resolve, reject) => {
      const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
      if (signal?.aborted) return onAbort();
      signal?.addEventListener('abort', onAbort, { once: true });

      records.set(url, {
        url,
        resolve: () => {
          signal?.removeEventListener('abort', onAbort);
          const body = url.includes('spain') ? [SPAIN] : [SP];
          resolve(
            new Response(JSON.stringify(body), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          );
        },
        reject,
      });
    });
  });
}

const flush = async () => {
  await vi.advanceTimersByTimeAsync(0);
};

describe('SearchController race handling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('aborts the earlier request and keeps only the latest results', async () => {
    const pending = new Map<string, Pending>();
    const fetchMock = makeAbortAwareFetch(pending);
    vi.stubGlobal('fetch', fetchMock);

    const controller = new SearchController(8000, 400);
    const states: AppState[] = [];
    controller.subscribe((s) => states.push(s));

    // 'sp' typed → debounce fires → fetch('sp') starts
    controller.setQuery('sp');
    await vi.advanceTimersByTimeAsync(400);
    await flush();
    const spPending = [...pending.values()][0]!;
    expect(spPending.url).toContain('/sp');

    // 'spain' typed → MUST abort 'sp' IMMEDIATELY (before debounce even runs)
    controller.setQuery('spain');
    expect(fetchMock.mock.calls.length).toBe(1); // no new fetch yet

    // Проверяем, что старый промис реально отменился
    await expect(fetchMock.mock.results[0]!.value as Promise<Response>).rejects.toMatchObject({
      name: 'AbortError',
    });

    // debounce for 'spain' fires → second fetch starts
    await vi.advanceTimersByTimeAsync(400);
    await flush();
    expect(pending.size).toBe(2);

    // Now resolve the LATER request (spain) first...
    pending.get([...pending.keys()][1]!)!.resolve();
    await flush();

    await vi.advanceTimersByTimeAsync(2000);
    await flush();

    const last = states[states.length - 1]!;
    expect(last.status).toBe('success');
    if (last.status === 'success') {
      expect(last.results).toHaveLength(1);
      expect(last.results[0]!.name).toBe('Spain');
    }
  });

  it('does not report AbortError to user (no error state)', async () => {
    const pending = new Map<string, Pending>();
    vi.stubGlobal('fetch', makeAbortAwareFetch(pending));

    const controller = new SearchController(8000, 100);
    const states: AppState[] = [];
    controller.subscribe((s) => states.push(s));

    controller.setQuery('a');
    await vi.advanceTimersByTimeAsync(100);
    await flush();
    controller.setQuery('ab'); // abort in-flight 'a'
    await vi.advanceTimersByTimeAsync(100);
    await flush();
    await vi.advanceTimersByTimeAsync(500);
    await flush();

    expect(states.some((s) => s.status === 'error')).toBe(false);
  });
});
