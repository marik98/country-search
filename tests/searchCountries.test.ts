import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchCountries } from '../src/lib/searchCountries';
import { HttpError } from '../src/lib/errors';

const sample = [{ name: 'Spain', capital: 'Madrid', region: 'Europe', population: 1 }];

describe('searchCountries', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed array on 200', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(sample), { status: 200 }));
    const signal = new AbortController().signal;
    const result = await searchCountries('spain', signal);
    expect(result).toEqual(sample);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://countries.dev/name/spain',
      expect.objectContaining({ signal }),
    );
  });

  it('returns empty array on 404 (no matches)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 404 }));
    const result = await searchCountries('zzz', new AbortController().signal);
    expect(result).toEqual([]);
  });

  it('throws HttpError on 500', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('boom', { status: 500 }));
    await expect(searchCountries('x', new AbortController().signal)).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it('HttpError carries status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 503 }));
    try {
      await searchCountries('x', new AbortController().signal);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(503);
    }
  });

  it('URL-encodes the query', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('[]', { status: 200 }));
    await searchCountries('côte d’ivoire', new AbortController().signal);
    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe(
      'https://countries.dev/name/c%C3%B4te%20d%E2%80%99ivoire',
    );
  });

  it('propagates AbortError when signal aborted before response', async () => {
    const controller = new AbortController();
    vi.mocked(fetch).mockImplementationOnce(
      (_url, init) =>
        new Promise((_res, rej) => {
          init?.signal?.addEventListener('abort', () =>
            rej(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const p = searchCountries('slow', controller.signal);
    controller.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
  });
});
