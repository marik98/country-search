import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from '../src/lib/mapCountryResponse';

const rawFull = {
  name: 'Spain',
  flag: '🇪🇸',
  capital: 'Madrid',
  region: 'Europe',
  population: 47351567,
  area: 505990,
  borders: ['FRA', 'PRT', 'AND'],
  languages: [{ name: 'Spanish' }],
  currencies: [{ name: 'Euro', symbol: '€' }],
  description: 'Spain is a country in Southern Europe.',
};

const rawMinimal = {
  name: 'Nowhereland',
  flag: '🏳️',
  capital: '',
  region: '',
  population: 0,
};

describe('mapCountryResponse', () => {
  it('maps all fields from a full record', () => {
    const c = mapCountryResponse(rawFull);
    expect(c).toEqual({
      name: 'Spain',
      flag: '🇪🇸',
      capital: 'Madrid',
      region: 'Europe',
      population: 47351567,
      area: 505990,
      borders: ['FRA', 'PRT', 'AND'],
      languages: ['Spanish'],
      currency: 'Euro',
      description: 'Spain is a country in Southern Europe.',
    });
  });

  it('omits optional fields when absent', () => {
    const c = mapCountryResponse(rawMinimal);
    expect(c.name).toBe('Nowhereland');
    expect(c.area).toBeUndefined();
    expect(c.borders).toBeUndefined();
    expect(c.languages).toBeUndefined();
    expect(c.currency).toBeUndefined();
    expect(c.description).toBeUndefined();
  });

  it('is pure: does not mutate input', () => {
    const clone = structuredClone(rawFull);
    mapCountryResponse(rawFull);
    expect(rawFull).toEqual(clone);
  });

  it('is deterministic', () => {
    expect(mapCountryResponse(rawFull)).toEqual(mapCountryResponse(rawFull));
  });

  it('handles empty languages array', () => {
    const c = mapCountryResponse({ ...rawFull, languages: [] });
    expect(c.languages).toEqual([]);
  });
});
