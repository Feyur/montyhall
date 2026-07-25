// Vite всегда пишет index.html — даём файлу понятное имя,
// чтобы его можно было просто отправить человеку и открыть двойным кликом.
import { renameSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'dist-offline';
const FILE_NAME = 'Парадокс Монти Холла.html';

const from = join(OUT_DIR, 'index.html');
const to = join(OUT_DIR, FILE_NAME);

renameSync(from, to);

const sizeMb = (statSync(to).size / 1024 / 1024).toFixed(2);
console.log(`\nОфлайн-версия: ${to} (${sizeMb} МБ) — открывается двойным кликом, без установки.`);
