// scratch: screenshots of key states (not part of the gate)
import { chromium } from 'playwright';
import { richSave } from '../e2e/v4/lib/rich-save.mjs';
const OUT = '/tmp/claude-0/-home-user-patrons/5ebe88de-0e49-593c-823a-8e25da0176c7/scratchpad/ui';
const base = process.env.URL || 'http://localhost:5283';
const tag = process.argv[2] || 'a';
const sizes = [
  ['laptop', { viewport: { width: 1270, height: 700 } }],
  ['w900', { viewport: { width: 900, height: 700 } }],
  ['phone', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }],
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [name, opts] of sizes) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(name, 'pageerror', e.message));
  await page.goto(base + '/');
  await page.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), richSave());
  await page.reload();
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.players');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${tag}-${name}-place.png` });
  if (name === 'phone') await page.screenshot({ path: `${OUT}/${tag}-${name}-place-full.png`, fullPage: true });
  const slot = await page.$('.slot.can .base');
  const bb = await slot.boundingBox();
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(400);
  const conf = await page.$('[data-place]'); if (conf) await conf.click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${tag}-${name}-after-place.png` });
  for (let k = 0; k < 6 && !(await page.$('.fbuy.live')); k++) { const o = await page.$('.prompt.choice button[data-option]:not([disabled])'); if (o) await o.click().catch(() => {}); await page.waitForTimeout(300); }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${tag}-${name}-buy.png` });
  if (name === 'phone') await page.screenshot({ path: `${OUT}/${tag}-${name}-buy-full.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
