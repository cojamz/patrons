import { chromium } from 'playwright';
import { membersSave } from '/home/user/patrons/e2e/v4/lib/members-save.mjs';
const out = process.argv[2] || '/tmp/probe.png', base = process.argv[3] || 'http://127.0.0.1:5402';
const { save, roundStart } = membersSave();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } }); page.setDefaultTimeout(90000);
await page.goto(`${base}/?botDelay=300&intro=0`, { timeout: 120000 });
await page.click('[data-home="local"]'); await page.click('[data-start]');
await page.waitForFunction(() => { try { return !!JSON.parse(localStorage.getItem('patrons.v4.local')).state.build; } catch { return false; } });
const stamp = await page.evaluate(() => JSON.parse(localStorage.getItem('patrons.v4.local')).state.build);
save.state.build = stamp; roundStart.state.build = stamp;
await page.goto(`${base}/?botDelay=300&intro=0`, { timeout: 120000 });
await page.evaluate(([v, rs]) => { localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs)); }, [save, roundStart]);
await page.reload();
await page.waitForSelector('.lt-wheel, [data-home="resume"]');
if (!(await page.$('.lt-wheel'))) await page.click('[data-home="resume"]');
await page.waitForSelector('.lt-wheel .slot.can'); await page.waitForTimeout(600);
const res = [];
for (const pid of [1, 2, 3, 0]) {
  for (const part of ['.cs-leader', '.cs-who']) {
    await page.mouse.move(4, 690); await page.waitForTimeout(250);
    const el = await page.$(`[data-cult="${pid}"] ${part}`); if (!el) { res.push(`${pid}${part}: none`); continue; }
    const b = await el.boundingBox(); const px = b.x + b.width / 2, py = b.y + b.height / 2;
    await page.mouse.move(px, py); await page.waitForTimeout(300);
    const r = await page.evaluate(id => { const L = document.querySelector('[data-hover-layer][data-open="1"]'); const s = document.querySelector(`[data-cult="${id}"]`).getBoundingClientRect(); if (!L) return null; const a = L.getBoundingClientRect(); return { card: [a.left, a.top, a.right, a.bottom].map(Math.round), seat: [s.left, s.top, s.right, s.bottom].map(Math.round), kind: L.querySelector('[data-hover-card]')?.dataset.hoverCard }; }, pid);
    res.push(`${pid}${part} ptr ${Math.round(px)},${Math.round(py)} -> ${JSON.stringify(r)}`);
    if (pid === 1 && part === '.cs-leader') await page.screenshot({ path: out });
  }
}
console.log(res.join('\n'));
await browser.close();
