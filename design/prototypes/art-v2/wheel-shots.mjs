import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [url, outDir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 1270, height: 700 }, deviceScaleFactor: 2 })).newPage();
await p.goto(`${url}/?botDelay=20&intro=0`);
await p.click('[data-home="local"]'); await p.waitForSelector('[data-start]'); await p.click('[data-start]');
let n = 0; const t0 = Date.now();
while (Date.now() - t0 < 120000) {
  if (n >= 30 && await p.$('.lt[data-yours="1"][data-phase="place"] .pcell.lit')) break;
  const h = await p.$('[data-handoff]'); if (h) { await h.click(); continue; }
  const nx = await p.$('[data-next-round]'); if (nx) { await nx.click().catch(() => {}); continue; }
  const opts = await p.$$('[data-option]:not([disabled])'); const ids = [];
  for (const o of opts) ids.push([o, await o.getAttribute('data-option')]);
  const rank = id => (/^card:/.test(id) || /^pay:/.test(id) ? 0 : /^tier:/.test(id) ? 1 : /^(back|undo|pass|@unpick)/.test(id) ? 9 : 2);
  ids.sort((x, y) => rank(x[1]) - rank(y[1]));
  if (!ids.length || !ids[0][1]) { await p.waitForTimeout(50); continue; }
  await ids[0][0].click().catch(() => {}); n++; await p.waitForTimeout(60);
}
await p.mouse.move(640, 3); await p.waitForTimeout(1500);
const box = await p.$eval('.stage', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
await p.screenshot({ path: `${outDir}/wheel-now.png` });
for (const d of (process.argv[4] || 'a,b,c').split(',')) {
  await p.evaluate(([css, d]) => { document.getElementById('dir')?.remove(); const s = document.createElement('style'); s.id = 'dir'; s.textContent = css; document.head.appendChild(s); }, [readFileSync(`design/prototypes/art-v2/wheel-${d}.css`, 'utf8'), d]);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${outDir}/wheel-${d}.png` });
}
console.log(JSON.stringify(box));
await b.close();
