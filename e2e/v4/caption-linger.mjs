import { launchBrowser, browserPath, cdpOk } from './lib/browser.mjs';
// E2E caption gate (Cory, Oct 28: "a pick an artifact selector lingering by the time two bots took their turn"). A
// caption held until a move's show has landed (the starting pick's panel, AfterChain in GameScreen.jsx) must go as the
// next move's show lands, not wait for a show to end: since the next move starts at the landing, rivals' shows rarely
// end. At 1100x700 (the narrow layout, where the pick is a panel), Relaxed and 4x CPU where it can throttle: a fresh
// game's starting picks, then the first placements; the "Pick an artifact" panel must be gone two steps after the last
// pick. Server: $V4_URL.
const base = process.env.V4_URL;
if (!base) { console.error('caption-linger: set V4_URL'); process.exit(2); }
const browser = await launchBrowser({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 700 } });
await ctx.addInitScript(() => {
  try { localStorage.setItem('patrons.v4.motionSpeed', 'relaxed'); } catch { /* private window */ }
  window.__lg = [];
  const look = () => {
    const g = document.querySelector('.app.game');
    if (g) window.__lg.push({ panel: !!document.querySelector('.prompt.choice.setup, [data-art-draft]'), phase: g.dataset.phase, shown: Number(g.dataset.presentationMoves) });
    requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
if (cdpOk) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
await page.goto(`${base}/?intro=0&sound=off`);
await page.click('[data-home="local"]');
await page.click('[data-start]');
await page.waitForSelector('.app.game');
const t0 = Date.now();
let placed = 0;
while (Date.now() - t0 < 90000 && placed < 6) {
  const g = await page.evaluate(() => { const e = document.querySelector('.app.game'); return e ? { yours: e.dataset.yours === '1', anim: e.dataset.animating === 'true', phase: e.dataset.phase, shown: Number(e.dataset.presentationMoves) } : null; }).catch(() => null);
  if (g && g.phase !== 'setup') placed = Math.max(placed, g.shown);
  if (g && g.yours && !g.anim && g.phase === 'setup') { const t = await page.$('.prompt.choice.setup [data-option], [data-art-draft].mine [data-option], [data-option]'); if (t) await t.click().catch(() => {}); }
  await page.waitForTimeout(150);
}
const lg = await page.evaluate(() => window.__lg);
await browser.close();
const firstPlace = lg.find(x => x.phase !== 'setup');
if (!firstPlace) errors.push('the starting picks never ended');
else {
  const late = lg.filter(x => x.panel && x.phase !== 'setup' && x.shown >= firstPlace.shown + 2);
  if (late.length) errors.push(`"Pick an artifact" still up ${late[late.length - 1].shown - firstPlace.shown} steps past the last pick`);
  console.log(`caption-linger: last pick at step ${firstPlace.shown}; the panel was up through step ${Math.max(firstPlace.shown, ...lg.filter(x => x.panel).map(x => x.shown))}`);
}
if (errors.length) { console.error(errors.join('\n')); console.log('FAIL caption-linger'); process.exit(1); }
console.log('PASS caption-linger');
