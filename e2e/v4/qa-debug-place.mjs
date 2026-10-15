import { chromium, devices } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5404/?botDelay=30&intro=0');
await page.click('[data-home="local"]'); await page.waitForSelector('[data-start]'); await page.click('[data-start]');
for (let n = 0; n < 6; n++) {
  // play setup and get to our place step
  for (let k = 0; k < 400; k++) {
    if (await page.$('.lt[data-phase="place"][data-yours="1"]')) break;
    const nx = await page.$('[data-next-round]'); if (nx) { await nx.tap().catch(() => {}); continue; }
    const o = await page.$('.lt[data-yours="1"] [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option="back"])');
    if (o && !(await page.$('.lt[data-phase="place"]'))) await o.tap().catch(() => {});
    else if (await page.$('.dialog.pay')) await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  const slot = await page.$('.slot[data-option]');
  const id = await slot.getAttribute('data-option');
  const m0 = await page.$eval('.app.game', e => e.dataset.moves);
  await slot.tap().catch(e => console.log('slot tap failed', e.message.split('\n')[0]));
  const place = await page.waitForSelector('[data-place]', { timeout: 3000 }).catch(() => null);
  if (!place) { console.log(n, id, 'no Place here sheet'); continue; }
  let how = 'tap';
  try { await place.tap({ timeout: 2000 }); } catch (e) { how = 'FAILED: ' + e.message.split('\n').filter(l => /intercepts|not stable|not visible|outside|Timeout/.test(l)).slice(-2).join(' | '); }
  await page.waitForTimeout(1500);
  const m1 = await page.$eval('.app.game', e => e.dataset.moves);
  console.log(n, id, how, 'moves', m0, '->', m1);
  if (m0 === m1) await page.screenshot({ path: '/tmp/claude-0/-home-user-patrons/5ebe88de-0e49-593c-823a-8e25da0176c7/scratchpad/w/place-stuck.png' });
  // finish the turn: pass the buy
  for (let k = 0; k < 20 && !(await page.$('.lt[data-phase="buy"][data-yours="1"]')); k++) { const o = await page.$('.prompt.choice [data-option], .lt-seat [data-option], .lt-shop .card[data-option]'); if (o) await o.tap().catch(() => {}); await page.waitForTimeout(200); }
  const pass = await page.$('[data-option="pass"]'); if (pass) await pass.tap().catch(() => {});
  await page.waitForTimeout(400);
}
await browser.close();
