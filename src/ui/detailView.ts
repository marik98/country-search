import type { Country } from '../types';

export function openDetail(country: Country, container: HTMLElement): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'detail-backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'detail-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const close = document.createElement('button');
  close.className = 'detail-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close');
  close.addEventListener('click', () => backdrop.remove());

  const title = document.createElement('h2');
  title.textContent = `${country.flag} ${country.name}`;

  const dl = document.createElement('dl');
  const rows: Array<[string, string]> = [
    ['Description', country.description ?? '—'],
    ['Area', country.area !== undefined ? `${country.area.toLocaleString()} km²` : '—'],
    ['Borders', country.borders?.join(', ') || '—'],
    ['Languages', country.languages?.join(', ') || '—'],
    ['Currency', country.currency ?? '—'],
  ];

  for (const [k, v] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    dl.append(dt, dd);
  }

  dialog.append(close, title, dl);
  backdrop.append(dialog);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  container.append(backdrop);
  close.focus();
}
