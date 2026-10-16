// Design pod: every font size on the game screen with visible text, how much text uses it, and where.
//   node scripts/design-pod/typescale.mjs [--state place|buy] [--size 1270x700]
import { chromium } from 'playwright';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const [W, H] = flag('size', '1270x700').split('x').map(Number);
const base = process.env.V4_URL || 'http://127.0.0.1:5410';
const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
let s = createGame({ seats: SEATS, seed: 5 });
const rand = seededRandom(5);
const ok = st => st.round === 2 && st.pending && st.pending.player === 0 && st.pending.kind === 'place' && Object.values(st.slots).filter(v => v === 0).length >= 1;
for (let n = 0; n < 6000 && !ok(s); n++) s = applyMove(s, chooseBotMove(s, rand));
const save = { config: { seats: SEATS, speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
await page.goto(`${base}/?intro=0`);
await page.evaluate(async v => { const m = await import('/src/v4/session/record.js'); v.state.build = { ...m.BUILD }; localStorage.clear(); localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.introSeen', '1'); }, save);
await page.goto(`${base}/?intro=0`); await page.click('[data-home="resume"]', { timeout: 90000 }); await page.waitForSelector('.lt-shop .card'); await page.mouse.move(4, H - 4); await page.waitForTimeout(1200);
if (flag('state', 'place') === 'buy') {
  const sl = await page.$('.slot.can .base'); const bb = await sl.boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  for (let k = 0; k < 16 && !(await page.$('.lt[data-phase="buy"][data-yours="1"]')); k++) { const o = await page.$('.lt[data-phase="choose"] :is(.cs-pick-seat[data-option], .cs-stack[data-option], .prompt.choice button[data-option])'); if (o) await o.click().catch(() => {}); await page.waitForTimeout(300); }
  await page.mouse.move(4, H - 4); await page.waitForTimeout(600);
}
const rows = await page.evaluate(() => {
  const by = {};
  const region = e => { const r = e.closest('[data-region], .lt-since, .turn-card'); return r ? (r.dataset.region || r.className.split(' ')[0]) : 'other'; };
  for (const e of document.querySelectorAll('.app.game *')) {
    if (e instanceof SVGElement && e.tagName !== 'text') continue;
    const t = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
    if (!t) continue;
    const st = getComputedStyle(e); const bx = e.getBoundingClientRect();
    if (st.visibility === 'hidden' || st.display === 'none' || !bx.width || bx.bottom < 0 || bx.top > innerHeight) continue;
    if (e.closest('[aria-hidden="true"]')) continue;
    const k = `${parseFloat(st.fontSize).toFixed(1)}px ${st.fontWeight}`;
    (by[k] = by[k] || { n: 0, where: {} }).n += t.length;
    const w = `${region(e)}:${(typeof e.className === 'string' ? e.className : e.getAttribute('class') || e.tagName).split(' ')[0] || e.tagName}`;
    by[k].where[w] = (by[k].where[w] || 0) + 1;
  }
  return Object.entries(by).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([k, v]) => `${k.padEnd(12)} chars ${String(v.n).padStart(4)}  ${Object.entries(v.where).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([w, n]) => `${w}×${n}`).join(' ')}`);
});
console.log(rows.join('\n'));
await b.close();
