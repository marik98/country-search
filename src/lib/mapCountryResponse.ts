import type { Country, RawCountry } from '../types';

export function mapCountryResponse(raw: RawCountry): Country {
  const result: Country = {
    name: raw.name,
    flag: raw.flag,
    capital: raw.capital,
    region: raw.region,
    population: raw.population,
  };

  if (raw.area !== undefined) result.area = raw.area;
  if (raw.borders !== undefined) result.borders = [...raw.borders]; // копируем массив, чтобы не мутировать оригинал
  if (raw.languages !== undefined) result.languages = raw.languages.map((l) => l.name);
  if (raw.currencies?.[0] !== undefined) result.currency = raw.currencies[0].name;
  if (raw.description !== undefined) result.description = raw.description;

  return result;
}
