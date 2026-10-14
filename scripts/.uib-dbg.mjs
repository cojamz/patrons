import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const lab = await b.newPage({ viewport: { width: 1270, height: 700 } });
await lab.goto('http://localhost:5293/?lab=b&phase=place');
await lab.waitForSelector('[data-hover-layer]');
await lab.waitForTimeout(1500);
await lab.evaluate(() => {
  window.__l = []; let t0 = null, what = null;
  const vis = () => !!document.querySelector('[data-hover-layer][data-open="1"]');
  addEventListener('pointerover', e => { const t = e.target.closest && e.target.closest('[data-slot], [data-uid]'); if (t && !vis()) { t0 = performance.now(); what = t.dataset.slot ? 'space ' + t.dataset.slot : 'card ' + t.dataset.uid; } }, true);
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__l.push(['longtask', Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] });
  const tick = () => { if (t0 != null && vis()) { window.__l.push([what, Math.round(performance.now() - t0)]); t0 = null; } requestAnimationFrame(tick); }; requestAnimationFrame(tick);
});
const c = await lab.$$eval('[data-slot] .base, [data-region="shop"] [data-uid]', els => els.map(e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }));
for (const [x, y] of c.slice(0, 30)) { await lab.mouse.move(4, 690); await lab.waitForTimeout(220); await lab.mouse.move(x, y, { steps: 2 }); await lab.waitForTimeout(160); }
console.log(JSON.stringify(await lab.evaluate(() => window.__l)));
await b.close();
