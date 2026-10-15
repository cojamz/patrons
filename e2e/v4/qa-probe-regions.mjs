import { chromium } from 'playwright';
import { answerChoice } from './lib/answer.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
await page.goto('http://127.0.0.1:5404/?botDelay=30&intro=0');
await page.click('[data-home="local"]'); await page.waitForSelector('[data-start]'); await page.click('[data-start]');
await page.waitForSelector('.lt-seat[data-pid]');
let base = null, round = null, reports = 0;
const t0 = Date.now();
while (!(await page.$('.results')) && Date.now() - t0 < 400000 && reports < 12) {
  const next = await page.$('[data-next-round]'); if (next) { await next.click().catch(() => {}); continue; }
  const r = await page.evaluate(() => {
    const g = document.querySelector('.app.game'); if (!g) return null;
    const box = e => { if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(Math.round).join(','); };
    const regions = Object.fromEntries(['shop', 'seat-0', 'seat-1', 'seat-2', 'seat-3'].map(k => [k, box(document.querySelector(`.lt [data-region="${k}"]`))]));
    const anims = document.getAnimations().filter(a => a.playState === 'running').map(a => { const t = a.effect && a.effect.target; return t ? `${t.tagName}.${String(t.className).split(' ').slice(0, 2).join('.')}${t.dataset && t.dataset.region ? '[' + t.dataset.region + ']' : ''}:${a.animationName || a.transitionProperty || 'js'}` : '?'; }).filter(s => /lt-seat|lt-shop|region|lt-cult-seat|lt-snake/.test(s));
    const seats = [...document.querySelectorAll('.lt > .lt-seat')].map(e => `${e.dataset.region}:slot${e.dataset.slot}:y${e.style.getPropertyValue('--y')}:h${e.offsetHeight}:${getComputedStyle(e).transform}`);
    return { regions, phase: g.dataset.phase, round: g.dataset.round, anims, seats, rail: document.querySelector('.lt > .lt-snake')?.offsetHeight };
  });
  if (r && r.phase && !['over', 'reckon'].includes(r.phase)) {
    if (r.round !== round) { await page.waitForTimeout(900); round = r.round; base = null; }
    if (!base) base = r;
    else for (const k of Object.keys(r.regions)) if (r.regions[k] !== base.regions[k]) { reports++; console.log(`[${r.round} ${base.phase}->${r.phase}] ${k}: ${base.regions[k]} -> ${r.regions[k]} | anims ${JSON.stringify(r.anims)} | seats ${JSON.stringify(r.seats)} | base seats ${JSON.stringify(base.seats)} rail ${base.rail}->${r.rail}`); base = r; break; }
  }
  const did = await answerChoice(page); await page.waitForTimeout(did ? 20 : 40);
}
console.log('done', Math.round((Date.now() - t0) / 1000));
await browser.close();
