// Render the language plate: node design/prototypes/language/shoot.mjs [tag]
// Writes plate.png (1270×700), plate-detail.png (a 2× crop of the wedge and the cards),
// and, with a tag, copies into renders/<tag>-*.png for the iteration log.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, copyFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const tag = process.argv[2];
const url = 'file://' + join(here, 'plate.html');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function shot(scale, out, clip) {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 }, deviceScaleFactor: scale });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(here, out), clip });
  if (errors.length) console.error(errors.join('\n'));
  await page.close();
}

await shot(1, 'plate.png');
await shot(2, 'plate-detail-board.png', { x: 24, y: 160, width: 640, height: 400 });
await shot(2, 'plate-detail-cards.png', { x: 776, y: 24, width: 470, height: 660 });
await browser.close();

if (tag) {
  mkdirSync(join(here, 'renders'), { recursive: true });
  for (const f of ['plate.png', 'plate-detail-board.png', 'plate-detail-cards.png'])
    copyFileSync(join(here, f), join(here, 'renders', `${tag}-${f}`));
}
console.log('rendered', tag || '');
