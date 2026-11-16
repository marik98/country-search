import { cpSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

execSync('npx tsc', { stdio: 'inherit' });
cpSync('index.html', 'dist/index.html');
cpSync('styles.css', 'dist/styles.css');
writeFileSync('dist/.nojekyll', ''); // Для GitHub Pages