import { HttpError } from './errors';
import type { RawCountry } from '../types';

const BASE_URL = 'https://countries.dev/name';

export async function searchCountries(query: string, signal: AbortSignal): Promise<RawCountry[]> {
  const url = `${BASE_URL}/${encodeURIComponent(query)}`;
  const response = await fetch(url, { signal });

  if (response.status === 404) {
    return []; // 404 means "no matches" here, not an error
  }
  if (!response.ok) {
    throw new HttpError(response.status);
  }
  return (await response.json()) as RawCountry[];
}
