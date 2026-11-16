import type { Country } from '../types';

export function createCountryCard(country: Country, onSelect: (c: Country) => void): HTMLElement {
  const card = document.createElement('article');
  card.className = 'country-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Details for ${country.name}`);

  const flag = document.createElement('span');
  flag.className = 'country-card__flag';
  flag.textContent = country.flag;

  const name = document.createElement('h3');
  name.className = 'country-card__name';
  name.textContent = country.name;

  const dl = document.createElement('dl');
  dl.className = 'country-card__details';

  for (const [label, value] of [
    ['Capital', country.capital || '—'],
    ['Region', country.region || '—'],
    ['Population', country.population.toLocaleString()],
  ] as const) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.append(dt, dd);
  }

  card.append(flag, name, dl);

  card.addEventListener('click', () => onSelect(country));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(country);
    }
  });

  return card;
}
