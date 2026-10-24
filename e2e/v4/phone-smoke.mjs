// SKIPPED (phone-only): phone is out of scope (Cory, 2026-10-20). scripts/v4-check.mjs runs it only with V4_PHONE=1.
// Basic touch compatibility, not a mobile layout/polish verdict. Tests the built game supplied in V4_URL.
import { chromium } from 'playwright';
import { browserPath } from './lib/browser.mjs';
import { answerChoice } from './lib/answer.mjs';
import { mkdirSync } from 'node:fs';
const url = process.env.V4_URL;
if (!url) throw new Error('V4_URL must name the built game to check');
const shots = process.env.V4_SHOTS || '/tmp/patrons-phone-smoke';
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: browserPath });
try {
  for (const width of [390, 412]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { Math.random = () => 0; }); // human starts; reproducible touch path
    await page.goto(`${url}${url.includes('?') ? '&' : '?'}botDelay=30&intro=0&speed=quick`);
    await page.locator('[data-home="local"]').tap();
    await page.locator('[data-start]').tap();
    let placed = 0, recruited = 0;
    const deadline = Date.now() + 75000;
    while (Date.now() < deadline) {
      const place = page.locator('[data-place]');
      const recruit = page.locator('[data-recruit]');
      const hand = page.locator('[data-handoff]');
      if (await place.count()) { await place.tap(); placed++; }
      else if (await recruit.count()) { await recruit.tap(); recruited++; }
      else if (await hand.count()) await hand.tap();
      else await answerChoice(page, { prefer: ['card:', 'tier:'], last: ['pass'], avoid: ['release:'], timeout: 300, press: async el => { await el.tap({ timeout: 300 }); return true; } });
      await page.waitForTimeout(100);
      const acquired = await page.locator('.lt-seat[data-pid="0"]').evaluate(el => ({ members: el.querySelectorAll('.cs-member').length, followers: Number(el.querySelector('[data-followers]')?.dataset.followers || 1) })).catch(() => ({ members: 0, followers: 1 }));
      if (placed && (acquired.members > 0 || acquired.followers > 1)) break;
    }
    await page.screenshot({ path: `${shots}/touch-${width}.png`, fullPage: true });
    const acquired = await page.locator('.lt-seat[data-pid="0"]').evaluate(el => ({ members: el.querySelectorAll('.cs-member').length, followers: Number(el.querySelector('[data-followers]')?.dataset.followers || 1) }));
    if (!placed || !(acquired.members || acquired.followers > 1)) throw new Error(`${width}px: touch did not complete placement and a purchase (${JSON.stringify({placed,recruited,acquired})})`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errors.push('sideways overflow');
    if (errors.length) throw new Error(`${width}px: ${errors.join('; ')}`);
    console.log(`PASS phone ${width}px: touch setup, placement, purchase; ${acquired.members} members, ${acquired.followers} followers`);
    await context.close();
  }
} finally { await browser.close(); }
