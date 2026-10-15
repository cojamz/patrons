import { chromium } from 'playwright';
import { richSave } from '../e2e/v4/lib/rich-save.mjs';
const [base, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1270, height: 700 } });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(`${base}/?intro=0`);
await p.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), richSave());
await p.reload();
await (await p.waitForSelector('[data-home="resume"]')).click();
await p.waitForSelector('.slot.can .base');
await p.waitForTimeout(800);
const count = () => p.evaluate(() => document.querySelectorAll('.piece-flight').length);
const tide = await p.evaluateHandle(() => [...document.querySelectorAll('.slot.can')].find(e => /Tide/.test(e.getAttribute('aria-label'))));
await (await tide.asElement().$('.base')).click();
let seen = 0;
for (let k = 0; k < 6; k++) { seen = Math.max(seen, await count()); if (k === 1) await p.screenshot({ path: `${dir}/gain-mid.png` }); await p.waitForTimeout(60); }
console.log('gain pieces seen', seen, 'total', await p.evaluate(() => window.__patronsPieces));
await p.waitForTimeout(1200);
const big = await p.waitForSelector('[data-option^="tier:"]:has-text("→ 6")', { timeout: 8000 });
await big.click();
const pay = await p.waitForSelector('.dialog.pay .btn.pri[data-option]', { timeout: 3000 }).catch(() => null);
if (pay) { await p.waitForTimeout(300); await pay.click(); }
seen = 0;
for (let k = 0; k < 8; k++) { seen = Math.max(seen, await count()); if (k === 2) await p.screenshot({ path: `${dir}/buy-mid.png` }); await p.waitForTimeout(50); }
console.log('buy pieces seen', seen, 'total', await p.evaluate(() => window.__patronsPieces));
console.log('errors', errs.join(' | ') || 'none');
await b.close();
