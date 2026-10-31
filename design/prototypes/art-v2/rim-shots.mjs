// Zoomed crops of the wheel's ring bands, to judge where the ring's words sit in the band (url outDir tag).
import { chromium } from 'playwright';
const [url, out, tag] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 1270, height: 700 }, deviceScaleFactor: 3 })).newPage();
await p.goto(`${url}/?botDelay=20&intro=0`);
await p.click('[data-home="local"]'); await p.waitForSelector('[data-start]'); await p.click('[data-start]');
const t0 = Date.now();
while (Date.now() - t0 < 60000) {
  if (await p.$('.lt[data-yours="1"][data-phase="place"] .pcell.lit')) break;
  const h = await p.$('[data-handoff]'); if (h) { await h.click().catch(() => {}); continue; }
  const o = await p.$('[data-option]:not([disabled])'); if (o) await o.click().catch(() => {}); await p.waitForTimeout(80);
}
await p.mouse.move(640, 3); await p.waitForTimeout(1500);
const r = await p.$eval('.stage svg.wheel-paper', e => { const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; });
await p.screenshot({ path: `${out}/${tag}-top.png`, clip: { x: r.x + r.w * 0.25, y: r.y, width: r.w * 0.5, height: r.h * 0.12 } });
await p.screenshot({ path: `${out}/${tag}-bot.png`, clip: { x: r.x + r.w * 0.25, y: r.y + r.h * 0.88, width: r.w * 0.5, height: r.h * 0.12 } });
await b.close();
