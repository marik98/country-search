import { debounce } from '../lib/debounce.js';
import { searchCountries } from '../lib/searchCountries.js';
import { mapCountryResponse } from '../lib/mapCountryResponse.js';
import { classifyError } from '../lib/classifyError.js';
import type { AppState } from './state.js';

const DEFAULT_DEBOUNCE_MS = 400;
const DEFAULT_TIMEOUT_MS = 8000;

export class SearchController {
  private state: AppState = { status: 'idle' };
  private readonly listeners = new Set<(s: AppState) => void>();
  private controller: AbortController | null = null;
  private lastQuery = '';
  private readonly debounced: (q: string) => void;

  constructor(
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
    debounceMs: number = DEFAULT_DEBOUNCE_MS,
  ) {
    this.debounced = debounce((q: string) => void this.runSearch(q), debounceMs);
  }

  subscribe(fn: (s: AppState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  getState(): AppState {
    return this.state;
  }

  setQuery(input: string): void {
    const query = input.trim();
    // Отменяем ТЕКУЩИЙ запрос НЕМЕДЛЕННО, не дожидаясь debounce!
    this.abortInFlight();
    this.lastQuery = query;

    if (!query) {
      this.setState({ status: 'idle' });
      return;
    }
    this.setState({ status: 'loading' });
    this.debounced(query);
  }

  retry(): void {
    if (!this.lastQuery) return;
    this.abortInFlight();
    void this.runSearch(this.lastQuery);
  }

  private abortInFlight(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  private setState(next: AppState): void {
    this.state = next;
    for (const l of this.listeners) l(next);
  }

  private async runSearch(query: string): Promise<void> {
    const own = new AbortController();
    this.controller = own;

    // Объединяем наш сигнал отмены и сигнал таймаута
    const signal =
      typeof AbortSignal.any === 'function'
        ? AbortSignal.any([own.signal, AbortSignal.timeout(this.timeoutMs)])
        : this.combineSignals(own.signal, AbortSignal.timeout(this.timeoutMs));

    try {
      const raw = await searchCountries(query, signal);
      if (this.controller !== own) return;

      const results = raw.map(mapCountryResponse);
      if (results.length === 0) {
        this.setState({ status: 'empty', query });
      } else {
        this.setState({ status: 'success', query, results });
      }
    } catch (err) {
      if (this.controller !== own) return;

      const c = classifyError(err);
      // Если это наша собственная отмена (AbortError) — молчим, не показываем ошибку!
      if (c.kind === 'abort') return;

      this.setState({ status: 'error', query, message: c.message });
    } finally {
      if (this.controller === own) this.controller = null;
    }
  }

  // Фолбэк для браузеров без AbortSignal.any
  private combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
    const ctrl = new AbortController();
    const onAbort = (s: AbortSignal) => () => ctrl.abort(s.reason);
    if (a.aborted) ctrl.abort(a.reason);
    else if (b.aborted) ctrl.abort(b.reason);
    else {
      a.addEventListener('abort', onAbort(a), { once: true });
      b.addEventListener('abort', onAbort(b), { once: true });
    }
    return ctrl.signal;
  }
}
