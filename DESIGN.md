# Design Document

## Cancellation of stale requests

We use `AbortController`. On every keystroke `SearchController.setQuery()` calls
`abort()` **synchronously**, before the debounce fires. This guarantees that
the in-flight network request is truly cancelled (visible as `canceled` in
DevTools Network tab), so an older response can never overwrite a newer one.

We deliberately do **not** rely on a "latest timestamp / latest query id" flag
to filter late responses. A flag only hides the symptom — the network request
still runs and wastes bandwidth and the server still processes it. Abort is
the real fix.

At the fetch layer we compose two signals into one:

    AbortSignal.any([ownController.signal, AbortSignal.timeout(8000)])

- `ownController` aborts on new input or on `retry()`/clear;
- `AbortSignal.timeout(8000)` aborts if the server does not answer in time.

In the catch we distinguish the two — they are semantically different:

- `err.name === 'AbortError'` → our own cancellation → **silent**, no user-facing error.
- `err.name === 'TimeoutError'` → real failure → show error + Retry.
- `err instanceof HttpError` (status !== 404) → real failure → show error + Retry.
- `404` is intercepted in `searchCountries` **before** `response.ok` and returns `[]` — "no matches", not an error.
- anything else (TypeError from fetch, etc.) → network error → show error + Retry.

Because abort rejects the promise with `AbortError`, the whole race cannot
happen: the older promise never resolves. The optional `if (this.controller !== own) return`
check after `await` is a defensive safety net, not the primary mechanism.

## Debounce delay: 400 ms

- If we remove debounce entirely, every keystroke fires a request → dozens of
  round trips for one word, wasteful server load, high chance of interleaving
  even with abort (aborts happen too fast, UI flickers).
- If we increase delay a lot (≥ 800–1000 ms), typing feels sluggish: the user
  has finished typing but waits almost a second before results appear.
- 400 ms is a common sweet spot: long enough to coalesce typical typing speed
  (≈ 200 ms/char), short enough that the result appears shortly after typing stops.
  Combined with immediate abort on every input event, it is safe to keep it
  moderately small.

## Big O Complexity

### `mapCountryResponse`

- Constant number of fields → **O(1)** w.r.t. size of the country.
- Array of languages → **O(L)** where L = number of languages (typically ≤ 3).
- No nested loops over growing structures.
- Pure: no shared mutable state; input is not mutated (arrays are copied).

## Clean code principles — where applied

- **Single Responsibility**
  - `debounce.ts` — only timing.
  - `searchCountries.ts` — only HTTP + response.ok / 404 / HttpError.
  - `mapCountryResponse.ts` — only mapping, pure, no I/O.
  - `classifyError.ts` — only taxonomy of errors.
  - `searchController.ts` — only orchestration (abort, timeout, states).
  - `renderState.ts` / `countryCard.ts` — only DOM.
- **Pure functions & testability** — `debounce`, `mapCountryResponse`,
  `classifyError` are DOM-free and network-free; tests hit them directly.
- **No `innerHTML`/`insertAdjacentHTML`** — all DOM built with `createElement`,
  `textContent`, `append`. XSS-safe by construction.
- **Explicit named constants** — `DEFAULT_DEBOUNCE_MS`, `DEFAULT_TIMEOUT_MS`
  in `searchController.ts`.
- **Error taxonomy as a value** — `ClassifiedError` discriminated union avoids
  scattering `err.name === ...` checks across the UI.
- **Dependency inversion** — `SearchController` does not touch DOM; the
  subscriber pattern (`subscribe`) lets `main.ts` wire it to `renderState`.
