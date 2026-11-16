import { SearchController } from './app/searchController';
import { renderState, type RenderHandles } from './ui/renderState';

const root = document.createElement('main');
const header = document.createElement('h1');
header.textContent = 'Country Search';

const searchBar = document.createElement('div');
searchBar.className = 'search-bar';
const input = document.createElement('input');
input.type = 'search';
input.placeholder = 'Type a country name…';
input.setAttribute('aria-label', 'Search countries');
searchBar.append(input);

const status = document.createElement('div');
status.className = 'status';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');

const list = document.createElement('ul');
list.className = 'country-list';

root.append(header, searchBar, status, list);
document.body.append(root);

const controller = new SearchController();
const handles: RenderHandles = { status, list, onRetry: () => controller.retry() };

controller.subscribe((state) => renderState(state, handles));

input.addEventListener('input', () => controller.setQuery(input.value));
