import type { Country } from '../types';

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; query: string; results: Country[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; message: string };
