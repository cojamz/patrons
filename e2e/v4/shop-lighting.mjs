// Placement and its space hover must not darken the shop (Cory's screenshot regression).
import { chromium } from 'playwright';
import { browserPath } from './lib/browser.mjs';
import { mkdirSync } from 'node:fs';
import { aimSave } from './lib/aim-save.mjs';
import { seedSave } from './lib/seed.mjs';
const url = process.env.V4_URL;
if (!url) throw new Error('V4_URL must name the built game to check');
const shots = process.env.V4_SHOTS || '/tmp/patrons-shop-lighting';
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: browserPath });
try {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
  // round III, P1 to place, Recruit a Member open with two face-up members it lights (lib/aim-save.mjs): the space
  // hover that lights shop cards since Open Door was cut (round I rework, Oct 27)
  const { save, key } = aimSave();
  await seedSave(page, save);
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}intro=0&speed=quick&botDelay=30`);
  await page.locator('[data-home="resume"]').click();
  await page.waitForSelector('.app[data-phase="place"][data-yours="1"]:not(.in-setup)', { timeout: 15000 });
  const spot = page.locator(`[data-slot="${key}"] .base`).first();
  await ((await spot.count()) ? spot : page.locator(`[data-slot="${key}"]`).first()).hover({ timeout: 3000 });
  const aim = page.locator('.lt-card[data-aim]').first();
  await aim.waitFor();
  await page.waitForTimeout(300);
  const read = await aim.evaluate(el => {
    const c = getComputedStyle(el), ancestors = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.filter !== 'none' || Number(s.opacity) < 1) ancestors.push({ node: e.className, filter: s.filter, opacity: s.opacity });
    }
    return { outline: parseFloat(c.outlineWidth), ancestors };
  });
  if (read.ancestors.length || read.outline < 3) throw new Error(`Target is still dim or unclear: ${JSON.stringify(read)}`);
  if (/no limit/i.test(await page.locator('.lt-rates').innerText())) throw new Error('Redundant no limit label remains');
  await page.screenshot({ path: `${shots}/recruit-member-1270.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Phone sideways overflow');
  await page.screenshot({ path: `${shots}/phone-390.png`, fullPage: true });
  console.log('PASS shop: placement hover fully bright, 3px target outline, no redundant label, no phone overflow');
} finally { await browser.close(); }
