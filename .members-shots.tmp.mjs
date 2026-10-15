// usage: node shots.mjs <prefix>
import { chromium } from 'playwright';
import { membersSave } from '/home/user/patrons/e2e/v4/lib/members-save.mjs';
const out = '/home/user/patrons/design/eval/members-ux', pre = process.argv[2] || 'before';
const base = 'http://127.0.0.1:5402';
const { save, roundStart, uids } = membersSave();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto(`${base}/?botDelay=300&intro=0`);
await page.evaluate(([v, rs]) => { localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs)); }, [save, roundStart]);
await page.reload();
await page.waitForSelector('.lt-wheel, [data-home="resume"]');
if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
await page.waitForSelector('.lt-wheel .slot.can', { timeout: 15000 });
await page.waitForTimeout(800);
await page.mouse.move(5, 690);
await page.screenshot({ path: `${out}/${pre}-1-table.png` });
const hov = async sel => { const b = await (await page.$(sel)).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + Math.min(14, b.height / 2)); };
await hov('[data-cult="0"] .cs-head'); await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/${pre}-2-your-seat-card.png` });
await page.mouse.move(5, 690); await page.waitForTimeout(250);
await hov('[data-cult="1"] .cs-head'); await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/${pre}-3-rival-seat-card.png` });
await page.mouse.move(5, 690); await page.waitForTimeout(250);
const fig = await page.$(`[data-cult="0"] .cs-member[data-member="gold.jackpot"] .fig`);
if (fig) {
  await hov(`[data-cult="0"] .cs-member[data-member="gold.jackpot"] .fig`); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${pre}-4-member-hover.png` });
  const btn = await page.$('[data-tip-body] [data-use]');
  if (btn) {
    const b = await btn.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
    await page.waitForTimeout(100);
    await page.mouse.down(); await page.mouse.up();
    await page.waitForTimeout(170); await page.screenshot({ path: `${out}/${pre}-5-use-flight.png` });
    await page.waitForTimeout(900); await page.mouse.move(5, 690); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/${pre}-6-after-use.png` });
    await hov('[data-cult="0"] .cs-head'); await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${pre}-7-seat-card-after.png` });
  } else console.log('no use button in the member hover');
}
const info = await page.evaluate(() => ({ prompt: document.querySelector('[data-region="prompt"]')?.innerText }));
console.log(JSON.stringify(info));
await browser.close();
