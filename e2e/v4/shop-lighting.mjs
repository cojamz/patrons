// Placement and its space hover must not darken the shop (Cory's screenshot regression).
import { chromium } from 'playwright';
import { browserPath } from './lib/browser.mjs';
import { mkdirSync } from 'node:fs';
const url = process.env.V4_URL;
if (!url) throw new Error('V4_URL must name the built game to check');
const shots = process.env.V4_SHOTS || '/tmp/patrons-shop-lighting';
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: browserPath });
try {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}intro=0&speed=quick&botDelay=30`);
  await page.locator('[data-home="local"]').click();
  await page.locator('[data-start]').click();
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (await page.locator('.app[data-phase="place"][data-yours="1"]:not(.in-setup)').count()) break;
    const color = page.locator('[data-option^="color:"]').first();
    if (await color.count()) await color.click({ timeout: 250 }).catch(() => {});
    await page.waitForTimeout(100);
  }
  await page.locator('.slot[aria-label^="Open Door,"]').hover({ timeout: 3000 });
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
  await page.screenshot({ path: `${shots}/open-door-1270.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Phone sideways overflow');
  await page.screenshot({ path: `${shots}/phone-390.png`, fullPage: true });
  console.log('PASS shop: placement hover fully bright, 3px target outline, no redundant label, no phone overflow');
} finally { await browser.close(); }
