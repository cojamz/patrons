// Screenshots of a Good Deed gift and a steal, step by step, at 1270×700 (morning fix: the gift card).
//   node design/eval/morning-fixes/gift/shoot.mjs <base url> <prefix>
import { chromium, devices } from 'playwright';
import { comboSave, swapSave } from '../../../../e2e/v4/lib/dialog-save.mjs';
import { stealSave } from '../../../../e2e/v4/lib/steal-save.mjs';
import { seedSave } from '../../../../e2e/v4/lib/seed.mjs';

const [base = 'http://localhost:5295', prefix = 'after'] = process.argv.slice(2);
const DIR = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
async function open(save, phone = false) {
  const ctx = await browser.newContext(phone ? devices['iPhone 13'] : { viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror', e.message));
  await seedSave(page, save);
  await page.goto(`${base}/?intro=0`);
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.app.game');
  await page.waitForTimeout(1500);
  await page.mouse.move(640, 695);
  return { ctx, page };
}
const shot = (page, n) => page.screenshot({ path: `${DIR}${prefix}-${n}.png` });
const tryClick = async (page, sel) => { const el = await page.$(sel); if (!el) { console.log('missing', sel); return false; } const b = await el.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(500); return true; };

for (const [tag, mk] of [['gooddeed', () => comboSave('gooddeed')], ['seeds', () => comboSave('seeds')], ['sweettalk', () => comboSave('sweettalk')], ['evenswap', () => swapSave('evenswap')], ['kickback', () => stealSave('kickback')]]) {
  const { ctx, page } = await open(mk());
  await shot(page, `${tag}-1`);
  // step one: a first pick (the card's, else the seat's)
  const first = (await page.$('.gift-card [data-option^="@pick:"]')) ? '.gift-card [data-option^="@pick:"]' : '[data-option^="@pick:"]';
  if (await page.$(first)) { await tryClick(page, first); await shot(page, `${tag}-2`); }
  await page.mouse.move(640, 695); await page.waitForTimeout(200);
  const second = await page.$('.gift-card [data-option]:not([data-option^="@"]):not([data-option="back"])');
  if (second) { await tryClick(page, '.gift-card [data-option]:not([data-option^="@"]):not([data-option="back"])'); await page.waitForTimeout(1200); await shot(page, `${tag}-3`); }
  await ctx.close();
}
{
  const { ctx, page } = await open(stealSave('help'));
  await shot(page, 'steal-1');
  for (let k = 2; k <= 4; k++) {
    const sel = (await page.$('.gift-card [data-option^="take:"]')) ? '.gift-card [data-option^="take:"]' : '.cs-stack.pick-on';
    if (!(await tryClick(page, sel))) break;
    await page.waitForTimeout(400);
    await shot(page, `steal-${k}`);
  }
  await ctx.close();
}
// the phone: Good Deed's card as the bottom sheet, before and after a color
{
  const { ctx, page } = await open(comboSave('gooddeed'), true);
  await page.screenshot({ path: `${DIR}${prefix}-phone-gooddeed-1.png` });
  const el = await page.$('.gift-card [data-option^="@pick:"]');
  if (el) { await el.tap(); await page.waitForTimeout(400); await page.screenshot({ path: `${DIR}${prefix}-phone-gooddeed-2.png` }); }
  await ctx.close();
}
await browser.close();
