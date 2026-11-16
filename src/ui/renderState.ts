import type { AppState } from '../app/state';
import type { Country } from '../types';
import { createCountryCard } from './countryCard';
import { openDetail } from './detailView';

export interface RenderHandles {
  status: HTMLElement;
  list: HTMLElement;
  onRetry: () => void;
}

export function renderState(state: AppState, h: RenderHandles): void {
  h.status.replaceChildren();
  h.list.replaceChildren();

  switch (state.status) {
    case 'idle':
      return;
    case 'loading': {
      h.status.className = 'status status--loading';
      h.status.textContent = 'Searching…';
      return;
    }
    case 'empty': {
      h.status.className = 'status status--empty';
      h.status.textContent = `No countries found for “${state.query}”`;
      return;
    }
    case 'error': {
      h.status.className = 'status status--error';
      const msg = document.createElement('span');
      msg.textContent = state.message;
      const retry = document.createElement('button');
      retry.className = 'retry';
      retry.textContent = 'Retry';
      retry.addEventListener('click', h.onRetry);
      h.status.append(msg, retry);
      return;
    }
    case 'success': {
      h.status.className = 'status';
      h.status.textContent = `${state.results.length} result${state.results.length === 1 ? '' : 's'}`;
      const onSelect = (c: Country) => openDetail(c, document.body);

      for (const c of state.results) {
        const li = document.createElement('li');
        li.append(createCountryCard(c, onSelect));
        h.list.append(li);
      }
      return;
    }
  }
}
