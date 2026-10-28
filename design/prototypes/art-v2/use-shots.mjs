import { chromium } from 'playwright';
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 1270, height: 700 }, deviceScaleFactor: 2 })).newPage();
await p.goto(`${url}/?botDelay=20&intro=0`);
await p.click('[data-home="local"]'); await p.waitForSelector('[data-start]'); await p.click('[data-start]');
const t0 = Date.now(); let shots = 0;
while (Date.now() - t0 < 420000 && shots < 3) {
  const r = await p.$('.lt-cult-seat .cs-member.ready');
  if (r) {
    await p.mouse.move(640, 3); await p.waitForTimeout(900);
    const seat = await r.evaluateHandle(e => e.closest('.lt-cult-seat'));
    await seat.screenshot({ path: `${out}/seat-${shots}.png` });
    await p.screenshot({ path: `${out}/full-${shots}.png` });
    shots++;
    const u = await p.$('.lt-cult-seat .cs-member.ready .fig'); await u.hover(); await p.waitForTimeout(800);
    await p.screenshot({ path: `${out}/hover-${shots-1}.png` });
    const btn = await p.$('[data-use]'); if (btn) { await btn.click().catch(()=>{}); await p.waitForTimeout(300); }
    continue;
  }
  const h = await p.$('[data-handoff]'); if (h) { await h.click(); continue; }
  const nx = await p.$('[data-next-round]'); if (nx) { await nx.click().catch(() => {}); continue; }
  const opts = await p.$$('[data-option]:not([disabled])'); const ids = [];
  for (const o of opts) ids.push([o, await o.getAttribute('data-option')]);
  const rank = id => (/^card:/.test(id) || /^pay:/.test(id) ? 0 : /^tier:/.test(id) ? 1 : /^use:/.test(id) ? 8 : /^(back|undo|pass|@unpick)/.test(id) ? 9 : 2);
  ids.sort((x, y) => rank(x[1]) - rank(y[1]));
  if (!ids.length || !ids[0][1]) { await p.waitForTimeout(50); continue; }
  await ids[0][0].click().catch(() => {}); await p.waitForTimeout(60);
}
await p.screenshot({ path: `${out}/end.png` }); console.log("shots", shots); await b.close();
