import { chromium } from 'playwright';
const [url, out, w = '1270', h = '700', hoverSel = ''] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
if (hoverSel) { const el = p.locator(hoverSel).first(); await el.hover(); await p.waitForTimeout(400); }
await p.screenshot({ path: out });
console.log('errors:', errs.slice(0, 5));
await b.close();
