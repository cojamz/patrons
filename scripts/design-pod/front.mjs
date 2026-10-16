import { browserPath } from '../../e2e/v4/lib/browser.mjs';
// Design pod: the screens before the game: home, the local setup (table pick: Classic / Random 4 / Custom), the lobby.
//   node scripts/design-pod/front.mjs <outdir> [--size 1270x700] [--x2]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const x2 = argv.includes('--x2'); if (x2) argv.splice(argv.indexOf('--x2'), 1);
const [W, H] = flag('size', '1270x700').split('x').map(Number);
const out = argv[0]; mkdirSync(out, { recursive: true });
const base = process.env.V4_URL || 'http://127.0.0.1:5410';
const b = await chromium.launch({ executablePath: browserPath });
const page = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: x2 ? 2 : 1 })).newPage();
await page.addInitScript(() => localStorage.setItem('patrons.v4.introSeen', '1'));
const shot = async n => { await page.mouse.move(2, H - 2); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${n}.png` }); console.log(`${out}/${n}.png`); };
await page.goto(`${base}/?intro=0`); await page.waitForSelector('[data-home="local"]', { timeout: 90000 });
await shot('home');
await page.click('[data-home="local"]'); await page.waitForSelector('[data-start]'); await shot('setup');
for (const label of ['Random', 'Custom']) {
  const btn = page.getByText(new RegExp('^' + label, 'i')).first();
  if (await btn.count()) { await btn.click().catch(() => {}); await shot(`setup-${label.toLowerCase()}`); }
}
await page.screenshot({ path: `${out}/setup-custom-full.png`, fullPage: true });
await b.close();
